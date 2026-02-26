// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OPMToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract POS is Ownable {

    OPMToken public token;

    struct Payment {
        address payer;
        uint256 amount;
        bool completed;
    }

    mapping(bytes32 => Payment) public payments;

    event PaymentCreated(bytes32 qrId, address merchant, uint256 amount);
    event PaymentCompleted(bytes32 qrId, address payer, uint256 amount);

    constructor(address _token) {
        token = OPMToken(_token);
    }

    function createPayment(uint256 amount) external returns (bytes32) {
        bytes32 qrId = keccak256(abi.encodePacked(msg.sender, block.timestamp, amount));
        payments[qrId] = Payment({payer: address(0), amount: amount, completed: false});
        emit PaymentCreated(qrId, msg.sender, amount);
        return qrId;
    }

    function pay(bytes32 qrId) external {
        Payment storage p = payments[qrId];
        require(!p.completed, "Already paid");
        require(token.balanceOf(msg.sender) >= p.amount, "Insufficient balance");
        token.transferFrom(msg.sender, owner(), p.amount);
        p.payer = msg.sender;
        p.completed = true;
        emit PaymentCompleted(qrId, msg.sender, p.amount);
    }
}
