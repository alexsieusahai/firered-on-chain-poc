pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MonLib.sol";


contract MonBaseStats is Ownable {
    mapping(uint => MonLib.Stats) public speciesIdToStats;

    function setStats(uint speciesId, uint hp, uint atk, uint spatk, uint def, uint spdef, uint speed)
        public onlyOwner {
        speciesIdToStats[speciesId] = MonLib.Stats(hp, atk, spatk, def, spdef, speed);
    }

    function getStats(uint speciesId)
        public view
        returns (MonLib.Stats memory) {
        return speciesIdToStats[speciesId];
    }
}
