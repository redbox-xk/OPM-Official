// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OPMMembership
 * @notice Soulbound (non-transferable, ERC-5192) membership NFT for the OnePremium 6-tier system.
 *         Tokens are minted/updated exclusively by the OPMMembershipVault staking contract,
 *         so a member's tier always reflects their locked OPM balance.
 *
 *         ERC-5192: every token is permanently "locked" (soulbound). The transfer hook reverts
 *         on any wallet-to-wallet transfer; only mint (from == 0) and burn (to == 0) are allowed.
 */
contract OPMMembership is ERC721, Ownable {
    /// @dev ERC-5192 events.
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    event TierChanged(address indexed member, uint256 indexed tokenId, uint8 oldTier, uint8 newTier);
    event MinterUpdated(address indexed minter);

    // The vault contract authorized to mint, burn, and update tiers.
    address public minter;

    // Sequential token id counter.
    uint256 private _nextTokenId = 1;

    // tokenId => tier (1..6)
    mapping(uint256 => uint8) public tierOf;
    // owner => tokenId (each wallet holds at most one membership)
    mapping(address => uint256) public tokenIdOf;

    string private _baseTokenURI;

    modifier onlyMinter() {
        require(msg.sender == minter, "OPM: caller is not the minter");
        _;
    }

    constructor(string memory baseURI_) ERC721("OnePremium Membership", "OPM-MEMBER") Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "OPM: zero minter");
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    // ---------------------------------------------------------------------
    // Minter-only lifecycle (called by the staking vault)
    // ---------------------------------------------------------------------

    /// @notice Mint a soulbound membership for `to` at `tier`, or update tier if one already exists.
    function mintOrUpdate(address to, uint8 tier) external onlyMinter returns (uint256 tokenId) {
        require(to != address(0), "OPM: zero recipient");
        require(tier >= 1 && tier <= 6, "OPM: invalid tier");

        tokenId = tokenIdOf[to];
        if (tokenId == 0) {
            tokenId = _nextTokenId++;
            tokenIdOf[to] = tokenId;
            tierOf[tokenId] = tier;
            _safeMint(to, tokenId);
            emit Locked(tokenId);
            emit TierChanged(to, tokenId, 0, tier);
        } else {
            uint8 old = tierOf[tokenId];
            if (old != tier) {
                tierOf[tokenId] = tier;
                emit TierChanged(to, tokenId, old, tier);
            }
        }
    }

    /// @notice Burn a member's NFT when they fully unstake.
    function burnFor(address from) external onlyMinter {
        uint256 tokenId = tokenIdOf[from];
        require(tokenId != 0, "OPM: no membership");
        uint8 old = tierOf[tokenId];

        delete tokenIdOf[from];
        delete tierOf[tokenId];
        _burn(tokenId);

        emit TierChanged(from, tokenId, old, 0);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice ERC-5192: all tokens are permanently locked (soulbound).
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function tierOfOwner(address owner) external view returns (uint8) {
        uint256 tokenId = tokenIdOf[owner];
        if (tokenId == 0) return 0;
        return tierOf[tokenId];
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // ---------------------------------------------------------------------
    // Soulbound enforcement (OpenZeppelin v5 _update hook)
    // ---------------------------------------------------------------------

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Allow mint (from == 0) and burn (to == 0); block every real transfer.
        require(from == address(0) || to == address(0), "OPM: soulbound, non-transferable");
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        // 0xb45a3c0e == ERC-5192 interface id
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}
