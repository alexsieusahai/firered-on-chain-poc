// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ServerOwnable.sol";
import "./MonManager.sol";
import "./MonNFT.sol";
import "./Constants.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract Item is Ownable, ServerOwnable {
    /*
      Creation and consumption of items.
     */
    MonNFT _monNFT ;
    MonManager _monManager;

    constructor(MonNFT monNFT, MonManager monManager) {
        _monNFT = monNFT;
        _monManager = monManager;
    }

    // address => itemId => amount
    mapping(address => mapping(uint => uint)) userInventory;

    modifier hasItem(address user, uint itemId) {
        require(userInventory[user][itemId] > 0, "User does not have that item in inventory");
        _;
    }

    function giveItem(address user, uint itemId, uint amount)
        public onlyServer {
        userInventory[user][itemId] += amount;
    }

    function getInventory(address user)
        public view
        returns (uint[1000] memory)
    {
        uint[1000] memory inventory;
        for (uint i = 0; i < Constants.ITEM_ID_MAX; ++i) {
            inventory[i] = userInventory[user][i];
        }
        return inventory;
    }

    function useItem(address user, uint itemId, uint monId)
        public hasItem(user, itemId) onlyServer {
        console.log("NOTIMPLEMENTEDWARNING: battle needs to be able to call useItem as well...");
        userInventory[user][itemId] -= 1;

        console.log("using item with id", itemId, "on mon", monId);
        if (itemId == 1) {
            // potion
            _monNFT.increaseHP(monId, 2000);
        } else {
            require(false, "Item has not been implemented");
        }
    }
}
