// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrincipalToken (PT-wKDA)
 * @dev Represents the principal component of yield-bearing wKDA
 * @notice PT tokens can be redeemed 1:1 for the underlying asset at maturity
 */
contract PrincipalToken is ERC20, ReentrancyGuard, Ownable {
    
    // The underlying asset (wKDA)
    address public immutable underlyingAsset;
    
    // The yield token contract address
    address public yieldToken;
    
    // The yield splitter contract (only this can mint/burn)
    address public yieldSplitter;
    
    // Maturity timestamp
    uint256 public immutable maturity;
    
    // Whether the token has expired
    bool public isExpired;
    
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event MaturityReached();
    
    modifier onlyYieldSplitter() {
        require(msg.sender == yieldSplitter, "Only yield splitter can call");
        _;
    }
    
    modifier onlyBeforeMaturity() {
        require(block.timestamp < maturity, "Token has matured");
        _;
    }
    
    modifier onlyAfterMaturity() {
        require(block.timestamp >= maturity, "Token not yet matured");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        address _underlyingAsset,
        uint256 _maturity
    ) ERC20(name, symbol) {
        underlyingAsset = _underlyingAsset;
        maturity = _maturity;
        isExpired = false;
    }
    
    /**
     * @notice Set the yield splitter contract address (only owner)
     * @param _yieldSplitter Address of the yield splitter contract
     */
    function setYieldSplitter(address _yieldSplitter) external onlyOwner {
        require(yieldSplitter == address(0), "Yield splitter already set");
        yieldSplitter = _yieldSplitter;
    }
    
    /**
     * @notice Set the yield token contract address (only owner)
     * @param _yieldToken Address of the yield token contract
     */
    function setYieldToken(address _yieldToken) external onlyOwner {
        require(yieldToken == address(0), "Yield token already set");
        yieldToken = _yieldToken;
    }
    
    /**
     * @notice Mint PT tokens (only yield splitter)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyYieldSplitter onlyBeforeMaturity {
        _mint(to, amount);
        emit Mint(to, amount);
    }
    
    /**
     * @notice Burn PT tokens (only yield splitter)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyYieldSplitter {
        _burn(from, amount);
        emit Burn(from, amount);
    }
    
    /**
     * @notice Check if token has reached maturity
     * @return bool True if current time >= maturity
     */
    function hasMatured() external view returns (bool) {
        return block.timestamp >= maturity;
    }
    
    /**
     * @notice Mark token as expired (can be called by anyone after maturity)
     */
    function markAsExpired() external onlyAfterMaturity {
        if (!isExpired) {
            isExpired = true;
            emit MaturityReached();
        }
    }
    
    /**
     * @notice Get time remaining until maturity
     * @return uint256 Seconds until maturity (0 if already matured)
     */
    function timeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) {
            return 0;
        }
        return maturity - block.timestamp;
    }
    
    /**
     * @notice Override transfer to add maturity checks if needed
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        // Add any additional transfer restrictions here if needed
    }
}
