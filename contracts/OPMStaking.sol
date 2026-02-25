// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OPMStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable opmToken;
    IERC20 public immutable rewardToken; // USDC

    uint256 public totalStaked;
    uint256 public accRewardPerShare;
    uint256 private constant PRECISION = 1e12;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    mapping(address => UserInfo) public userInfo;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 amount);

    constructor(address _opmToken, address _rewardToken) Ownable(msg.sender) {
        require(_opmToken != address(0), "Invalid OPM address");
        require(_rewardToken != address(0), "Invalid reward token address");

        opmToken = IERC20(_opmToken);
        rewardToken = IERC20(_rewardToken);
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero amount");

        UserInfo storage user = userInfo[msg.sender];

        _harvest(msg.sender);

        opmToken.safeTransferFrom(msg.sender, address(this), _amount);

        user.amount += _amount;
        totalStaked += _amount;

        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;

        emit Staked(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Insufficient stake");

        _harvest(msg.sender);

        user.amount -= _amount;
        totalStaked -= _amount;

        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;

        opmToken.safeTransfer(msg.sender, _amount);

        emit Unstaked(msg.sender, _amount);
    }

    function claim() external nonReentrant {
        _harvest(msg.sender);
    }

    function depositRewards(uint256 _amount) external onlyOwner {
        require(totalStaked > 0, "No stakers");

        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);

        accRewardPerShare += (_amount * PRECISION) / totalStaked;

        emit RewardsDeposited(_amount);
    }

    function pendingRewards(address _user) public view returns (uint256) {
        UserInfo memory user = userInfo[_user];

        uint256 accumulated = (user.amount * accRewardPerShare) / PRECISION;

        return accumulated - user.rewardDebt;
    }

    function _harvest(address _user) internal {
        UserInfo storage user = userInfo[_user];

        uint256 pending = pendingRewards(_user);

        if (pending > 0) {
            rewardToken.safeTransfer(_user, pending);
            emit Claimed(_user, pending);
        }

        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;
    }
}
