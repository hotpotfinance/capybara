// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20, Ownable {

    constructor() ERC20("BUSD Token", "BUSD") {
        _mint(msg.sender, 10000000000000000000000000);
    }
}