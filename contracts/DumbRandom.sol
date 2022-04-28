pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract DumbRandom {
    function getRandom() public view returns (uint) {
        return block.timestamp;
    }
}
