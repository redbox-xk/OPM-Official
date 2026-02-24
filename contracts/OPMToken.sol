// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../libraries/CopyrightToken.sol";

interface IUniswapV2Router {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

contract OPMToken is ERC20, ERC20Burnable, Ownable, Pausable, CopyrightToken {

    // -------------------------
    // Tokenomics
    // -------------------------
    uint256 public constant MAX_TX = 100_000 * 10 ** 18; // anti-whale max transaction
    uint256 public reflectionFee = 3; // 3% redistribution to holders
    uint256 public liquidityFee = 2;  // 2% auto-liquidity
    mapping(address => bool) private _excludedFromLimits;
    mapping(address => bool) private _excludedFromFees;

    // -------------------------
    // DEX & Liquidity
    // -------------------------
    IUniswapV2Router public router;
    address public liquidityReceiver;

    // -------------------------
    // Events
    // -------------------------
    event LiquidityAdded(uint256 tokenAmount, uint256 ethAmount);
    event FeesUpdated(uint256 reflection, uint256 liquidity);

    // -------------------------
    // Constructor
    // -------------------------
    constructor(address _router, address _liquidityReceiver)
        ERC20("One Premium", "OPM")
    {
        uint256 initialSupply = 10_000_000 * 10 ** 18;
        _mint(_msgSender(), initialSupply);
        _excludedFromLimits[_msgSender()] = true;
        _excludedFromFees[_msgSender()] = true;

        router = IUniswapV2Router(_router);
        liquidityReceiver = _liquidityReceiver;
    }

    // -------------------------
    // Overrides for Anti-Whale & Pausable
    // -------------------------
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        if(!_excludedFromLimits[from] && !_excludedFromLimits[to]) {
            require(amount <= MAX_TX, "OPM: Max transaction exceeded");
        }
        super._beforeTokenTransfer(from, to, amount);
    }

    // -------------------------
    // Fee & Reflection Mechanism
    // -------------------------
    function _transfer(address sender, address recipient, uint256 amount) internal override {
        uint256 transferAmount = amount;
        if(!_excludedFromFees[sender] && !_excludedFromFees[recipient]) {
            uint256 reflectAmount = amount * reflectionFee / 100;
            uint256 liquidityAmount = amount * liquidityFee / 100;
            uint256 totalFee = reflectAmount + liquidityAmount;
            transferAmount = amount - totalFee;

            // Distribute reflection
            _distributeReflection(reflectAmount);

            // Send liquidity portion to contract for later auto-add
            super._transfer(sender, address(this), liquidityAmount);
        }

        super._transfer(sender, recipient, transferAmount);
    }

    function _distributeReflection(uint256 amount) internal {
        // Simple proportional reflection to all holders (could be optimized with snapshot/LP system)
        uint256 totalSupply_ = totalSupply();
        for(uint i=0; i<10; i++) { // simplified: actual production would use iterable mapping or snapshot
            address holder = address(uint160(i + 1)); // placeholder for demo
            if(balanceOf(holder) > 0){
                uint256 reward = amount * balanceOf(holder) / totalSupply_;
                super._transfer(address(this), holder, reward);
            }
        }
    }

    // -------------------------
    // Owner Controls
    // -------------------------
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    func
