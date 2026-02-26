// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OPMToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Organization is Ownable {
    struct Merchant {
        string name;
        address wallet;
        bool active;
    }

    mapping(address => Merchant) public merchants;
    OPMToken public token;

    event MerchantAdded(address wallet, string name);
    event MerchantRemoved(address wallet);

    constructor(address _token) {
        token = OPMToken(_token);
    }

    function addMerchant(address wallet, string calldata name) external onlyOwner {
        merchants[wallet] = Merchant(name, wallet, true);
        emit MerchantAdded(wallet, name);
    }

    function removeMerchant(address wallet) external onlyOwner {
        delete merchants[wallet];
        emit MerchantRemoved(wallet);
    }
}
