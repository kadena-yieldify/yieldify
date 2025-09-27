// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WrappedKDA
 * @dev ERC20 token that wraps native KDA in 1:1 ratio
 * @notice This contract allows users to wrap KDA into wKDA tokens for use in DeFi protocols
 */
contract WrappedKDA is ERC20, ReentrancyGuard {
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    constructor() ERC20("Wrapped KDA", "wKDA") {}
    
    /**
     * @notice Deposit KDA and mint equivalent wKDA tokens
     * @dev Mints wKDA tokens 1:1 with deposited KDA
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Must send KDA");
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw KDA by burning wKDA tokens
     * @param amount Amount of wKDA to burn and KDA to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient wKDA balance");
        
        _burn(msg.sender, amount);
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "KDA transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }
    
    /**
     * @notice Fallback function to wrap KDA when sent directly to contract
     */
    receive() external payable {
        if (msg.value > 0) {
            _mint(msg.sender, msg.value);
            emit Deposit(msg.sender, msg.value);
        }
    }
    
    /**
     * @notice Get the total KDA backing this contract
     * @return Total KDA balance of the contract
     */
    function totalKDABacking() external view returns (uint256) {
        return address(this).balance;
    }
}
