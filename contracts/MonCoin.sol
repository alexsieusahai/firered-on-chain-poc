pragma solidity ^0.8.0;

import "./MonNFT.sol";
import "./Constants.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MonCoin is ERC20, Ownable {

    address _monNFTAddr;
    address _battleAddr;

    constructor() ERC20("MonCoin", "MONC") {}

    function setMonNFTAddress(address addr)
        public onlyOwner
    {
        _monNFTAddr = addr;
    }

    function setBattleAddress(address addr)
        public onlyOwner
    {
        _battleAddr = addr;
    }

    modifier onlyMonNFT {
        require(msg.sender == _monNFTAddr);
        _;
    }

    modifier onlyBattle {
        require(msg.sender == _battleAddr);
        _;
    }

    function starterCoins(address addr)
        public onlyMonNFT
    {
        _mint(addr, Constants.STARTER_COIN_AMOUNT);
    }

    function postBattleCoins(address addr, uint amount)
        public onlyBattle
    {
        _mint(addr, amount);
    }
}
