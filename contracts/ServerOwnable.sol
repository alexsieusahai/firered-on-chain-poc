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

    modifier onlyServerOr(address addr) {
        bool seen = addr == msg.sender;
        for (uint i = 0; i < serverAddresses.length; ++i) {
            if (serverAddresses[i] == msg.sender) seen = true;
        }
        require(seen, "Some contract tried to call a function it was not allowed to call");
        _;
    }

    modifier onlyServerOr2(address addr0, address addr1) {
        bool seen = addr0 == msg.sender || addr1 == msg.sender;
        for (uint i = 0; i < serverAddresses.length; ++i) {
            if (serverAddresses[i] == msg.sender) seen = true;
        }
        require(seen, "Some contract tried to call a function it was not allowed to call");
        _;
    }

    function addServerAddress(address addr)
        public onlyOwner {
        serverAddresses.push(addr);
    }

}
