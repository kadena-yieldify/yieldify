// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// DIA Oracle interface (simplified for MVP)
interface IDIAOracle {
    function getValue(string memory key) external view returns (uint128, uint128);
}

/**
 * @title DIAOracle
 * @dev Oracle contract for fetching price feeds using DIA data
 * @notice This contract provides price feeds for PT and YT tokens
 */
contract DIAOracle is Ownable, ReentrancyGuard {
    
    // Price feed data structure
    struct PriceFeed {
        uint256 price;          // Price with 18 decimals
        uint256 timestamp;      // Last update timestamp
        uint256 heartbeat;      // Maximum time between updates
        bool isActive;          // Whether feed is active
    }
    
    // DIA Oracle contract address (will be set to actual DIA oracle on mainnet)
    address public diaOracleAddress;
    
    // Price feeds mapping
    mapping(string => PriceFeed) public priceFeeds;
    
    // Supported price feed keys
    string[] public supportedFeeds;
    
    // Events
    event PriceUpdated(string indexed key, uint256 price, uint256 timestamp);
    event FeedAdded(string indexed key, uint256 heartbeat);
    event FeedRemoved(string indexed key);
    event DIAOracleUpdated(address indexed newOracle);
    
    // Constants
    uint256 public constant PRICE_DECIMALS = 18;
    uint256 public constant DEFAULT_HEARTBEAT = 3600; // 1 hour
    
    constructor() {
        // For MVP, we'll use mock prices
        // In production, set actual DIA oracle address
        _addPriceFeed("KDA/USD", DEFAULT_HEARTBEAT);
        _addPriceFeed("PT-wKDA/USD", DEFAULT_HEARTBEAT);
        _addPriceFeed("YT-wKDA/USD", DEFAULT_HEARTBEAT);
        
        // Set initial mock prices
        _updatePrice("KDA/USD", 0.5e18); // $0.50
        _updatePrice("PT-wKDA/USD", 0.48e18); // $0.48 (slight discount to underlying)
        _updatePrice("YT-wKDA/USD", 0.02e18); // $0.02 (yield component)
    }
    
    /**
     * @notice Set DIA Oracle contract address
     * @param _diaOracle Address of the DIA Oracle contract
     */
    function setDIAOracle(address _diaOracle) external onlyOwner {
        require(_diaOracle != address(0), "Invalid oracle address");
        diaOracleAddress = _diaOracle;
        emit DIAOracleUpdated(_diaOracle);
    }
    
    /**
     * @notice Add a new price feed
     * @param key Price feed key (e.g., "KDA/USD")
     * @param heartbeat Maximum time between updates in seconds
     */
    function addPriceFeed(string memory key, uint256 heartbeat) external onlyOwner {
        _addPriceFeed(key, heartbeat);
    }
    
    /**
     * @notice Remove a price feed
     * @param key Price feed key to remove
     */
    function removePriceFeed(string memory key) external onlyOwner {
        require(priceFeeds[key].isActive, "Feed not active");
        
        priceFeeds[key].isActive = false;
        
        // Remove from supported feeds array
        for (uint256 i = 0; i < supportedFeeds.length; i++) {
            if (keccak256(bytes(supportedFeeds[i])) == keccak256(bytes(key))) {
                supportedFeeds[i] = supportedFeeds[supportedFeeds.length - 1];
                supportedFeeds.pop();
                break;
            }
        }
        
        emit FeedRemoved(key);
    }
    
    /**
     * @notice Update price manually (for MVP/testing)
     * @param key Price feed key
     * @param price New price with 18 decimals
     */
    function updatePrice(string memory key, uint256 price) external onlyOwner {
        _updatePrice(key, price);
    }
    
    /**
     * @notice Get latest price for a given key
     * @param key Price feed key
     * @return price Latest price with 18 decimals
     * @return timestamp Last update timestamp
     */
    function getPrice(string memory key) external view returns (uint256 price, uint256 timestamp) {
        PriceFeed memory feed = priceFeeds[key];
        require(feed.isActive, "Price feed not active");
        require(block.timestamp - feed.timestamp <= feed.heartbeat, "Price data stale");
        
        return (feed.price, feed.timestamp);
    }
    
    /**
     * @notice Get latest price (view function, no staleness check)
     * @param key Price feed key
     * @return price Latest price with 18 decimals
     */
    function getLatestPrice(string memory key) external view returns (uint256 price) {
        PriceFeed memory feed = priceFeeds[key];
        require(feed.isActive, "Price feed not active");
        return feed.price;
    }
    
    /**
     * @notice Check if price data is fresh
     * @param key Price feed key
     * @return bool True if price is fresh
     */
    function isPriceFresh(string memory key) external view returns (bool) {
        PriceFeed memory feed = priceFeeds[key];
        if (!feed.isActive) return false;
        return block.timestamp - feed.timestamp <= feed.heartbeat;
    }
    
    /**
     * @notice Get PT/YT price ratio
     * @return ratio PT price / YT price with 18 decimals
     */
    function getPTYTRatio() external view returns (uint256 ratio) {
        uint256 ptPrice = priceFeeds["PT-wKDA/USD"].price;
        uint256 ytPrice = priceFeeds["YT-wKDA/USD"].price;
        
        require(ptPrice > 0 && ytPrice > 0, "Invalid prices");
        
        ratio = (ptPrice * 1e18) / ytPrice;
    }
    
    /**
     * @notice Get all supported price feeds
     * @return Array of supported feed keys
     */
    function getSupportedFeeds() external view returns (string[] memory) {
        return supportedFeeds;
    }
    
    /**
     * @notice Update prices from DIA Oracle (if available)
     * @param keys Array of price feed keys to update
     */
    function updatePricesFromDIA(string[] memory keys) external nonReentrant {
        require(diaOracleAddress != address(0), "DIA Oracle not set");
        
        IDIAOracle diaOracle = IDIAOracle(diaOracleAddress);
        
        for (uint256 i = 0; i < keys.length; i++) {
            string memory key = keys[i];
            require(priceFeeds[key].isActive, "Price feed not active");
            
            try diaOracle.getValue(key) returns (uint128 price, uint128 timestamp) {
                if (price > 0 && timestamp > 0) {
                    _updatePrice(key, uint256(price));
                }
            } catch {
                // Skip failed updates
                continue;
            }
        }
    }
    
    /**
     * @notice Calculate implied yield rate from PT/YT prices
     * @param timeToMaturity Time until maturity in seconds
     * @return yieldRate Implied annual yield rate in basis points
     */
    function getImpliedYieldRate(uint256 timeToMaturity) external view returns (uint256 yieldRate) {
        require(timeToMaturity > 0, "Invalid time to maturity");
        
        uint256 ptPrice = priceFeeds["PT-wKDA/USD"].price;
        uint256 underlyingPrice = priceFeeds["KDA/USD"].price;
        
        require(ptPrice > 0 && underlyingPrice > 0, "Invalid prices");
        require(ptPrice <= underlyingPrice, "PT price cannot exceed underlying");
        
        // Calculate discount rate: (underlying - pt) / pt
        uint256 discount = ((underlyingPrice - ptPrice) * 1e18) / ptPrice;
        
        // Annualize the rate: discount * (365 days / timeToMaturity)
        uint256 annualizedRate = (discount * 365 days) / timeToMaturity;
        
        // Convert to basis points (multiply by 10000)
        yieldRate = (annualizedRate * 10000) / 1e18;
    }
    
    /**
     * @notice Internal function to add price feed
     */
    function _addPriceFeed(string memory key, uint256 heartbeat) internal {
        require(!priceFeeds[key].isActive, "Feed already exists");
        require(heartbeat > 0, "Invalid heartbeat");
        
        priceFeeds[key] = PriceFeed({
            price: 0,
            timestamp: 0,
            heartbeat: heartbeat,
            isActive: true
        });
        
        supportedFeeds.push(key);
        emit FeedAdded(key, heartbeat);
    }
    
    /**
     * @notice Internal function to update price
     */
    function _updatePrice(string memory key, uint256 price) internal {
        require(priceFeeds[key].isActive, "Price feed not active");
        require(price > 0, "Invalid price");
        
        priceFeeds[key].price = price;
        priceFeeds[key].timestamp = block.timestamp;
        
        emit PriceUpdated(key, price, block.timestamp);
    }
    
    /**
     * @notice Emergency function to recover stuck tokens (only owner)
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            // For ERC20 tokens
            (bool success, ) = token.call(
                abi.encodeWithSignature("transfer(address,uint256)", owner(), amount)
            );
            require(success, "Token transfer failed");
        }
    }
}
