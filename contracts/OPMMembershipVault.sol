// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IOPMMembership {
    function mintOrUpdate(address to, uint8 tier) external returns (uint256);
    function burnFor(address from) external;
}

/**
 * @title OPMMembershipVault
 * @notice The "Locked-Utility Wrapper" for OnePremium.
 *
 *  Users lock $OPM to mint/upgrade a Soulbound Membership NFT across the 6-tier system.
 *  Locking creates a software-driven reason to take OPM out of circulation (reducing sell
 *  pressure on a 10,000-token micro-supply) while granting tiered platform benefits.
 *
 *  Tier thresholds (locked OPM):
 *    Tier 1: 1 OPM     Tier 4: 10 OPM
 *    Tier 2: 3 OPM     Tier 5: 25 OPM
 *    Tier 3: 5 OPM     Tier 6: 50 OPM
 *
 *  Reward routing: stakers earn from a reward pool (e.g. USDC) funded by the owner.
 *  A configurable `poolRouteBps` fraction of each deposited reward is split off and sent
 *  to a `liquidityRouter` (e.g. the ALM vault) to deepen OPM/ETH liquidity automatically.
 *
 *  Anti-manipulation note: this contract only locks/unlocks real user balances. It does NOT
 *  create synthetic volume. Any market-making must be done transparently and must never be
 *  used for wash trading.
 */
contract OPMMembershipVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable opmToken;
    IERC20 public immutable rewardToken;
    IOPMMembership public immutable membership;

    uint256 private constant PRECISION = 1e12;
    uint8 public constant MAX_TIER = 6;

    // Tier thresholds in whole OPM (scaled by token decimals in the constructor).
    uint256[6] public tierThresholds;

    // Optional lock duration before a user can unstake (anti-churn). 0 = no lock.
    uint256 public lockDuration;

    // Reward routing to a liquidity manager (basis points, max 2000 = 20%).
    address public liquidityRouter;
    uint16 public poolRouteBps;

    uint256 public totalStaked;
    uint256 public accRewardPerShare;

    struct UserInfo {
        uint256 amount;        // locked OPM
        uint256 rewardDebt;    // accounting baseline
        uint256 lockedUntil;   // earliest unstake timestamp
    }

    mapping(address => UserInfo) public userInfo;

    event Locked(address indexed user, uint256 amount, uint8 tier);
    event Unlocked(address indexed user, uint256 amount, uint8 tier);
    event Claimed(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 stakerAmount, uint256 routedToLiquidity);
    event LiquidityRouterUpdated(address router, uint16 bps);
    event LockDurationUpdated(uint256 duration);

    constructor(
        address _opmToken,
        address _rewardToken,
        address _membership,
        uint256 _opmDecimalsScale // e.g. 1e18
    ) Ownable(msg.sender) {
        require(_opmToken != address(0) && _rewardToken != address(0) && _membership != address(0), "OPM: zero addr");

        opmToken = IERC20(_opmToken);
        rewardToken = IERC20(_rewardToken);
        membership = IOPMMembership(_membership);

        tierThresholds[0] = 1 * _opmDecimalsScale;
        tierThresholds[1] = 3 * _opmDecimalsScale;
        tierThresholds[2] = 5 * _opmDecimalsScale;
        tierThresholds[3] = 10 * _opmDecimalsScale;
        tierThresholds[4] = 25 * _opmDecimalsScale;
        tierThresholds[5] = 50 * _opmDecimalsScale;
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setLiquidityRouter(address _router, uint16 _bps) external onlyOwner {
        require(_bps <= 2000, "OPM: bps too high"); // hard cap 20%
        liquidityRouter = _router;
        poolRouteBps = _bps;
        emit LiquidityRouterUpdated(_router, _bps);
    }

    function setLockDuration(uint256 _seconds) external onlyOwner {
        require(_seconds <= 365 days, "OPM: lock too long");
        lockDuration = _seconds;
        emit LockDurationUpdated(_seconds);
    }

    // ---------------------------------------------------------------------
    // Core: lock / unlock
    // ---------------------------------------------------------------------

    /// @notice Lock OPM, harvest pending rewards, and mint/upgrade the soulbound membership.
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "OPM: zero amount");
        UserInfo storage user = userInfo[msg.sender];

        _harvest(msg.sender);

        opmToken.safeTransferFrom(msg.sender, address(this), _amount);

        user.amount += _amount;
        totalStaked += _amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;
        if (lockDuration > 0) {
            user.lockedUntil = block.timestamp + lockDuration;
        }

        uint8 tier = _tierForAmount(user.amount);
        require(tier >= 1, "OPM: below tier 1 minimum");
        membership.mintOrUpdate(msg.sender, tier);

        emit Locked(msg.sender, _amount, tier);
    }

    /// @notice Unlock OPM, harvest rewards, then downgrade or burn the membership.
    function unstake(uint256 _amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(_amount > 0 && user.amount >= _amount, "OPM: insufficient locked");
        require(block.timestamp >= user.lockedUntil, "OPM: still locked");

        _harvest(msg.sender);

        user.amount -= _amount;
        totalStaked -= _amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;

        opmToken.safeTransfer(msg.sender, _amount);

        if (user.amount == 0) {
            membership.burnFor(msg.sender);
            emit Unlocked(msg.sender, _amount, 0);
        } else {
            uint8 tier = _tierForAmount(user.amount);
            // If their remaining balance drops below tier 1, burn; else update.
            if (tier == 0) {
                membership.burnFor(msg.sender);
            } else {
                membership.mintOrUpdate(msg.sender, tier);
            }
            emit Unlocked(msg.sender, _amount, tier);
        }
    }

    function claim() external nonReentrant {
        _harvest(msg.sender);
    }

    /// @notice Owner funds the reward pool; a slice is routed to the liquidity manager.
    function depositRewards(uint256 _amount) external onlyOwner {
        require(totalStaked > 0, "OPM: no stakers");
        require(_amount > 0, "OPM: zero amount");

        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 routed = 0;
        if (liquidityRouter != address(0) && poolRouteBps > 0) {
            routed = (_amount * poolRouteBps) / 10_000;
            if (routed > 0) {
                rewardToken.safeTransfer(liquidityRouter, routed);
            }
        }

        uint256 stakerAmount = _amount - routed;
        accRewardPerShare += (stakerAmount * PRECISION) / totalStaked;

        emit RewardsDeposited(stakerAmount, routed);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function pendingRewards(address _user) public view returns (uint256) {
        UserInfo memory user = userInfo[_user];
        uint256 accumulated = (user.amount * accRewardPerShare) / PRECISION;
        return accumulated - user.rewardDebt;
    }

    function currentTier(address _user) external view returns (uint8) {
        return _tierForAmount(userInfo[_user].amount);
    }

    function _tierForAmount(uint256 amount) internal view returns (uint8) {
        uint8 tier = 0;
        for (uint8 i = 0; i < MAX_TIER; i++) {
            if (amount >= tierThresholds[i]) {
                tier = i + 1;
            }
        }
        return tier;
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
