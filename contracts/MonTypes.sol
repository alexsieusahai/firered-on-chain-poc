pragma solidity ^0.8.0;

import "./Moves.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MonTypes is Ownable {
    /*
     Main use of this is to facilitate the mapping of speciesId to typing, with the convenience
     of calculating the damage multiplier of move types used on a certain mon.
     */
    Moves _moves;
    mapping(uint => uint[]) speciesIdToTypes;

    constructor(Moves moves) {
        _moves = moves;
    }

    modifier speciesAdded(uint speciesId) {
        require(speciesIdToTypes[speciesId].length > 0, "speciesId passed in has not been added yet or is invalid");
        _;
    }

    function addSpecies(uint speciesId, uint[] memory types)
        public onlyOwner
    {
        speciesIdToTypes[speciesId] = types;
    }

    function typeDamageMultiplier(uint speciesId, uint moveType)
        public speciesAdded(speciesId)
        returns (uint)
    {
        uint[] memory types = speciesIdToTypes[speciesId];
        uint multiplier = 1;
        for (uint i = 0; i < types.length; ++i) {
            multiplier *= _moves.typeMultiplier(moveType, types[i]);
        }
        multiplier /= 10 ** (types.length - 1);
        return multiplier;
    }

    function STABMultiplier(uint speciesId, uint moveType)
        public speciesAdded(speciesId)
        returns (uint)
    {
        require(speciesIdToTypes[speciesId].length > 0, "speciesId passed in has not been added yet or is invalid");
        uint[] memory types = speciesIdToTypes[speciesId];
        for (uint i = 0; i < types.length; ++i) {
            if (types[i] == moveType) {
                return 15;
            }
        }
        return 10;
    }
}
