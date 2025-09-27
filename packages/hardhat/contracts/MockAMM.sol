// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockAMM
 * @dev Simple AMM for swapping between PT and YT tokens
 * @notice This is a simplified AMM for demonstration purposes
 */
contract MockAMM is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Token contracts
    IERC20 public immutable principalToken;
    IERC20 public immutable yieldToken;
    
    // Pool reserves
    uint256 public ptReserve;
    uint256 public ytReserve;
    
    // Pool parameters
    uint256 public constant FEE_BASIS_POINTS = 30; // 0.3% fee
    uint256 public constant BASIS_POINTS = 10000;
    
    // Minimum liquidity to prevent division by zero
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    
    // Events
    event LiquidityAdded(address indexed provider, uint256 ptAmount, uint256 ytAmount);
    event LiquidityRemoved(address indexed provider, uint256 ptAmount, uint256 ytAmount);
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event PriceUpdate(uint256 ptPrice, uint256 ytPrice);
    
    constructor(address _principalToken, address _yieldToken) {
        principalToken = IERC20(_principalToken);
        yieldToken = IERC20(_yieldToken);
    }
    
    /**
     * @notice Add initial liquidity to the pool (only owner)
     * @param ptAmount Amount of PT tokens to add
     * @param ytAmount Amount of YT tokens to add
     */
    function addInitialLiquidity(uint256 ptAmount, uint256 ytAmount) external onlyOwner {
        require(ptReserve == 0 && ytReserve == 0, "Liquidity already exists");
        require(ptAmount > MINIMUM_LIQUIDITY && ytAmount > MINIMUM_LIQUIDITY, "Insufficient liquidity");
        
        principalToken.safeTransferFrom(msg.sender, address(this), ptAmount);
        yieldToken.safeTransferFrom(msg.sender, address(this), ytAmount);
        
        ptReserve = ptAmount;
        ytReserve = ytAmount;
        
        emit LiquidityAdded(msg.sender, ptAmount, ytAmount);
        emit PriceUpdate(getPrice(address(principalToken)), getPrice(address(yieldToken)));
    }
    
    /**
     * @notice Add liquidity to the pool maintaining current ratio
     * @param ptAmount Amount of PT tokens to add
     * @return ytAmount Amount of YT tokens required
     */
    function addLiquidity(uint256 ptAmount) external nonReentrant returns (uint256 ytAmount) {
        require(ptReserve > 0 && ytReserve > 0, "Pool not initialized");
        require(ptAmount > 0, "Amount must be greater than 0");
        
        // Calculate required YT amount to maintain ratio
        ytAmount = (ptAmount * ytReserve) / ptReserve;
        
        principalToken.safeTransferFrom(msg.sender, address(this), ptAmount);
        yieldToken.safeTransferFrom(msg.sender, address(this), ytAmount);
        
        ptReserve += ptAmount;
        ytReserve += ytAmount;
        
        emit LiquidityAdded(msg.sender, ptAmount, ytAmount);
    }
    
    /**
     * @notice Remove liquidity from the pool
     * @param ptAmount Amount of PT tokens to remove
     * @return ytAmount Amount of YT tokens returned
     */
    function removeLiquidity(uint256 ptAmount) external onlyOwner nonReentrant returns (uint256 ytAmount) {
        require(ptAmount > 0, "Amount must be greater than 0");
        require(ptAmount <= ptReserve, "Insufficient PT reserve");
        
        // Calculate proportional YT amount
        ytAmount = (ptAmount * ytReserve) / ptReserve;
        
        ptReserve -= ptAmount;
        ytReserve -= ytAmount;
        
        principalToken.safeTransfer(msg.sender, ptAmount);
        yieldToken.safeTransfer(msg.sender, ytAmount);
        
        emit LiquidityRemoved(msg.sender, ptAmount, ytAmount);
    }
    
    /**
     * @notice Swap PT tokens for YT tokens
     * @param ptAmountIn Amount of PT tokens to swap
     * @param minYtOut Minimum YT tokens expected (slippage protection)
     * @return ytAmountOut Amount of YT tokens received
     */
    function swapPTForYT(uint256 ptAmountIn, uint256 minYtOut) 
        external 
        nonReentrant 
        returns (uint256 ytAmountOut) 
    {
        require(ptAmountIn > 0, "Amount must be greater than 0");
        require(ptReserve > 0 && ytReserve > 0, "Pool not initialized");
        
        // Calculate output amount using constant product formula with fee
        ytAmountOut = _getAmountOut(ptAmountIn, ptReserve, ytReserve);
        require(ytAmountOut >= minYtOut, "Insufficient output amount");
        require(ytAmountOut < ytReserve, "Insufficient YT reserve");
        
        // Execute swap
        principalToken.safeTransferFrom(msg.sender, address(this), ptAmountIn);
        yieldToken.safeTransfer(msg.sender, ytAmountOut);
        
        // Update reserves
        ptReserve += ptAmountIn;
        ytReserve -= ytAmountOut;
        
        emit Swap(msg.sender, address(principalToken), address(yieldToken), ptAmountIn, ytAmountOut);
        emit PriceUpdate(getPrice(address(principalToken)), getPrice(address(yieldToken)));
    }
    
    /**
     * @notice Swap YT tokens for PT tokens
     * @param ytAmountIn Amount of YT tokens to swap
     * @param minPtOut Minimum PT tokens expected (slippage protection)
     * @return ptAmountOut Amount of PT tokens received
     */
    function swapYTForPT(uint256 ytAmountIn, uint256 minPtOut) 
        external 
        nonReentrant 
        returns (uint256 ptAmountOut) 
    {
        require(ytAmountIn > 0, "Amount must be greater than 0");
        require(ptReserve > 0 && ytReserve > 0, "Pool not initialized");
        
        // Calculate output amount using constant product formula with fee
        ptAmountOut = _getAmountOut(ytAmountIn, ytReserve, ptReserve);
        require(ptAmountOut >= minPtOut, "Insufficient output amount");
        require(ptAmountOut < ptReserve, "Insufficient PT reserve");
        
        // Execute swap
        yieldToken.safeTransferFrom(msg.sender, address(this), ytAmountIn);
        principalToken.safeTransfer(msg.sender, ptAmountOut);
        
        // Update reserves
        ytReserve += ytAmountIn;
        ptReserve -= ptAmountOut;
        
        emit Swap(msg.sender, address(yieldToken), address(principalToken), ytAmountIn, ptAmountOut);
        emit PriceUpdate(getPrice(address(principalToken)), getPrice(address(yieldToken)));
    }
    
    /**
     * @notice Get quote for swapping PT to YT
     * @param ptAmountIn Amount of PT tokens to swap
     * @return ytAmountOut Amount of YT tokens that would be received
     */
    function getQuotePTForYT(uint256 ptAmountIn) external view returns (uint256 ytAmountOut) {
        require(ptReserve > 0 && ytReserve > 0, "Pool not initialized");
        return _getAmountOut(ptAmountIn, ptReserve, ytReserve);
    }
    
    /**
     * @notice Get quote for swapping YT to PT
     * @param ytAmountIn Amount of YT tokens to swap
     * @return ptAmountOut Amount of PT tokens that would be received
     */
    function getQuoteYTForPT(uint256 ytAmountIn) external view returns (uint256 ptAmountOut) {
        require(ptReserve > 0 && ytReserve > 0, "Pool not initialized");
        return _getAmountOut(ytAmountIn, ytReserve, ptReserve);
    }
    
    /**
     * @notice Get current price of a token in terms of the other token
     * @param token Address of the token to get price for
     * @return price Price with 18 decimals (1e18 = 1:1 ratio)
     */
    function getPrice(address token) public view returns (uint256 price) {
        require(ptReserve > 0 && ytReserve > 0, "Pool not initialized");
        
        if (token == address(principalToken)) {
            // PT price in terms of YT
            price = (ytReserve * 1e18) / ptReserve;
        } else if (token == address(yieldToken)) {
            // YT price in terms of PT
            price = (ptReserve * 1e18) / ytReserve;
        } else {
            revert("Invalid token");
        }
    }
    
    /**
     * @notice Get pool information
     * @return ptReserve_ Current PT reserve
     * @return ytReserve_ Current YT reserve
     * @return ptPrice Current PT price
     * @return ytPrice Current YT price
     */
    function getPoolInfo() external view returns (
        uint256 ptReserve_,
        uint256 ytReserve_,
        uint256 ptPrice,
        uint256 ytPrice
    ) {
        ptReserve_ = ptReserve;
        ytReserve_ = ytReserve;
        
        if (ptReserve > 0 && ytReserve > 0) {
            ptPrice = getPrice(address(principalToken));
            ytPrice = getPrice(address(yieldToken));
        }
    }
    
    /**
     * @notice Calculate output amount for a swap using constant product formula
     * @param amountIn Input amount
     * @param reserveIn Input token reserve
     * @param reserveOut Output token reserve
     * @return amountOut Output amount after fees
     */
    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        // Apply fee to input amount
        uint256 amountInWithFee = amountIn * (BASIS_POINTS - FEE_BASIS_POINTS);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * BASIS_POINTS) + amountInWithFee;
        
        amountOut = numerator / denominator;
    }
    
    /**
     * @notice Emergency function to recover stuck tokens (only owner)
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
