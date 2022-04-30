pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ServerOwnable is Ownable {
    address[] serverAddresses;

    modifier onlyServer {
        bool isServer = false;
        for (uint i = 0; i < serverAddresses.length; ++i) {
            if (msg.sender == serverAddresses[i]) {
                isServer = true;
                break;
            }
        }
        require(isServer, "sender account must be a verified server!");
        _;
    }

    function addServerAddress(address addr)
        public onlyOwner {
        serverAddresses.push(addr);
    }

}
