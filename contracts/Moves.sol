pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Moves is Ownable {
    /*
     This should handle moveId -> all other information.
     */
    using Counters for Counters.Counter;
    Counters.Counter private _moveIds;

    uint constant NORMAL = 0;
    uint constant FIRE = 1;
    uint constant WATER = 2;
    uint constant GRASS = 3;
    uint constant ELECTRIC = 4;
    uint constant ICE = 5;
    uint constant FIGHTING = 6;
    uint constant POISON = 7;
    uint constant GROUND = 8;
    uint constant FLYING = 9;
    uint constant PSYCHIC = 10;
    uint constant BUG = 11;
    uint constant ROCK = 12;
    uint constant GHOST = 13;
    uint constant DRAGON = 14;
    uint constant DARK = 15;
    uint constant STEEL = 16;
    // move type => defender mon type => constant;
    mapping(uint => mapping(uint => uint)) public typeMultiplier;
    mapping(uint => Move) public idToMove;
    mapping(string => uint) public nameToId;
    mapping(uint => uint) public idToPP;

    struct Move {
        string name;
        uint moveType;
        bool isPhysical;
        uint power;
        uint accuracy;
        uint pp;
        bool makesContact;
    }

    constructor() {
        for (uint i = 0; i < 16; ++i) {
            for (uint j = 0; j < 16; ++j) {
                typeMultiplier[i][j] = 10;
            }
        }
    }

    function addMultiplier(uint type0, uint type1, uint multiplier)
        public onlyOwner
    {
        require(type0 >= 0 && type0 < 17, "type0 is invalid");
        require(type1 >= 0 && type1 < 17, "type1 is invalid");
        typeMultiplier[type0][type1] = multiplier;
    }

    function addInfo(string memory name,
                     uint moveType,
                     bool isPhysical,
                     uint power,
                     uint accuracy,
                     uint pp,
                     bool makesContact)
        public onlyOwner
    {
        _moveIds.increment();
        uint id = _moveIds.current();
        idToMove[id] = Move(name, moveType, isPhysical, power, accuracy, pp, makesContact);
        nameToId[name] = id;
        idToPP[id] = pp;
    }
}
