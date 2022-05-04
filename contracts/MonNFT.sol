//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DumbRandom.sol";
import "./MonLib.sol";
import "./MonBaseStats.sol";
import "./Moves.sol";
import "./MonCoin.sol";
import "./ServerOwnable.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MonNFT is ERC721URIStorage, Ownable, ServerOwnable {
    /*
     This handles the creation of new mons.
     */
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    DumbRandom private _dumbRandom;
    MonBaseStats private _baseStats;
    Moves private _moves;
    MonCoin private _monCoin;
    address private _battleAddress;
    address private _itemAddress;

    mapping(uint => uint) public idToSpecies;
    mapping(uint => uint) public idToLevel;
    mapping(uint => uint) public idToNature;
    mapping(uint => uint) public idToGender;
    mapping(uint => uint) public idToExp;
    mapping(uint => uint) public idToHP;
    mapping(uint => uint[4]) public idToPP;
    mapping(uint => uint[4]) public idToMoveset;
    mapping(uint => MonLib.Stats) public idToIV;
    mapping(uint => MonLib.Stats) public idToEV;
    mapping(uint => MonLib.Stats) public idToStats;
    mapping(uint => address) public idToOwner;
    mapping(address => uint) private ownerToLatestMon;

    constructor(DumbRandom dumbRandom,
                MonBaseStats baseStats,
                Moves moves,
                MonCoin monCoin)
        ERC721("MonNFT", "NFT") {
        _dumbRandom = dumbRandom;
        _baseStats = baseStats;
        _moves = moves;
        _monCoin = monCoin;
    }

    modifier onlyBattle {
        require(msg.sender == _battleAddress);
        _;
    }

    function setBattleAddress(address addr)
        public onlyOwner
    {
        _battleAddress = addr;
    }

    function setItemAddress(address addr)
        public onlyOwner
    {
        _itemAddress = addr;
    }

    function deductHP(uint id, uint amount)
        public onlyBattle
    {
        if (amount <= idToHP[id]) {
            idToHP[id] -= amount;
        } else {
            idToHP[id] = 0;
        }
    }

    function increaseHP(uint id, uint amount)
        public onlyServerOr2(_itemAddress, _battleAddress) {
        /*
          Server needs access to this for mon centers
          Battle needs access to this for any healing moves
          Item needs access to this for healing items
         */
        console.log("NOTIMPLEMENTEDWARNING: increaseHP should only be able to be called by Battle or server");
        if (idToHP[id] + amount > idToStats[id].hp) {
            idToHP[id] = idToStats[id].hp;
        } else {
            idToHP[id] += amount;
        }
    }

    function cloneMon(uint id)
        public onlyBattle
        returns (uint)
    {
        _tokenIds.increment();
        uint256 newId = _tokenIds.current();
        idToSpecies[newId] = idToSpecies[id];
        idToLevel[newId] = idToLevel[id];
        idToNature[newId] = idToNature[id];
        idToGender[newId] = idToGender[id];
        idToExp[newId] = idToExp[id];
        idToHP[newId] = idToHP[id];
        idToPP[newId] = idToPP[id];
        idToMoveset[newId] = idToMoveset[id];
        idToIV[newId] = idToIV[id];
        idToEV[newId] = idToEV[id];
        idToStats[newId] = idToStats[id];
        return newId;
    }

    function incrementExp(uint id, uint amount)
        public onlyBattle
    {
        console.log(id, "is getting exp", amount);
        idToExp[id] = idToExp[id] + amount;
        while (canLevel(id)) {
            handleLevelUp(id);
        }
    }

    function incrementEV(uint id, uint hp, uint atk, uint def, uint spatk, uint spdef, uint speed)
        public onlyBattle
    {
        if (idToEV[id].hp + hp < 256)
            {
                idToEV[id].hp += hp;
            }
        if (idToEV[id].atk + atk < 256)
            {
                idToEV[id].atk += atk;
            }
        if (idToEV[id].def + def < 256)
            {
                idToEV[id].def += def;
            }
        if (idToEV[id].spatk + spatk < 256)
            {
                idToEV[id].spatk += spatk;
            }
        if (idToEV[id].spdef + spdef < 256)
            {
                idToEV[id].spdef += spdef;
            }
        if (idToEV[id].speed + speed < 256)
            {
                idToEV[id].speed += speed;
            }
    }

    function levelRequirement(uint id)
        public view
        returns (uint)
    {
        return idToLevel[id] ** 3;
    }

    function canLevel(uint id)
        private
        returns (bool)
    {
        // uses generic currLevel ** 3 levelling requirement
        return idToExp[id] >= levelRequirement(id);
    }

    function handleLevelUp(uint id)
        private
    {
        idToExp[id] = idToExp[id] - levelRequirement(id);
        idToLevel[id]++;
        idToStats[id] = setupMonStats(idToLevel[id], idToSpecies[id], idToIV[id], idToEV[id]);
    }

    function mintSpeciesMon(address recipient,
                            uint speciesId,
                            uint level,
                            uint move0,
                            uint move1,
                            uint move2,
                            uint move3)
        public
        returns (uint256)
    {
        console.log("NOTIMPLEMENTEDWARNING: shouldn't call this, should instead make a mintStarterMon or something");
        console.log("NOTIMPLEMENTEDWARNING: should only be able to be called once per address");
        _monCoin.starterCoins(recipient);
        uint randomNumber = _dumbRandom.getRandom();
        uint[4] memory moveset = [move0, move1, move2, move3];
        return mintMon(recipient, randomNumber, speciesId, level, moveset);
    }

    function mintWildMon(address recipient, uint encounterTableIndex)
        public onlyOwner
        returns (uint256)
    {
        console.log("NOTIMPLEMENTEDWARNING: only available wild mon is pidgey");
        console.log("NOTIMPLEMENTEDWARNING: wild mons should initially belong to the wild, not the owner, otherwise easily abusable");
        uint randomNumber = _dumbRandom.getRandom();
        console.log("randomNumber from dumbRandom", randomNumber);
        console.log("NOTIMPLEMENTEDWARNING: missing wild encounter table calls");
        uint speciesId = 16; // wrong; this should be taken from the wild encounter table
        uint level = 3; // wrong; this should be taken from the wild encounter table
        uint[4] memory moveset = [uint256(1), 1, 1, 1]; // wrong; this should be taken from the wild encounter table
        return mintMon(recipient, randomNumber, speciesId, level, moveset);
    }

    function mintMon(address recipient, uint randomNumber, uint speciesId, uint level, uint[4] memory moveset)
        public onlyOwner
        returns (uint)
    {
        _tokenIds.increment();

        uint newItemId = _tokenIds.current();
        _mint(recipient, newItemId);

        // TODO we can just set this to the mon portrait IPFS file
        /* _setTokenURI(newItemId, tokenURI); */

        setupMon(randomNumber, speciesId, level, moveset, newItemId);
        idToOwner[newItemId] = recipient;
        ownerToLatestMon[recipient] = newItemId;
        return newItemId;
    }

    function getAndConsumeRandomBits(uint randomNumber, uint numBits) public view returns (uint, uint)
    {
        uint denom = 2**numBits;
        // TODO enable this once we have an actual 256 bit random number from chainlink VRF
        /* console.log("randomNumber", randomNumber); */
        /* require(randomNumber / denom > 0); // ensure there's still enough bits left */
        return (randomNumber % denom, randomNumber / denom);
    }

    function setupMonIvs(uint randomNumber)
        private
        returns (MonLib.Stats memory, uint)
    {
        MonLib.Stats memory ivs;
        (ivs.hp,randomNumber) = getAndConsumeRandomBits(randomNumber, 5);
        (ivs.atk,randomNumber) = getAndConsumeRandomBits(randomNumber, 5);
        (ivs.def,randomNumber) = getAndConsumeRandomBits(randomNumber, 5);
        (ivs.spatk,randomNumber) = getAndConsumeRandomBits(randomNumber, 5);
        (ivs.spdef,randomNumber) = getAndConsumeRandomBits(randomNumber, 5);
        (ivs.speed,randomNumber) = getAndConsumeRandomBits(randomNumber, 5);
        return (ivs,randomNumber);
    }

    function setupMonStats(uint level, uint speciesId, MonLib.Stats memory ivs, MonLib.Stats memory evs)
        private
        returns (MonLib.Stats memory)
    {
        // https://www.dragonflycave.com/mechanics/stats
        MonLib.Stats memory stats;
        stats = _baseStats.getStats(speciesId);
        stats.hp = (2 * stats.hp + ivs.hp + evs.hp) * level / 100 + (level + 10) * 100;
        uint natureModifier = 1;
        console.log("NOTIMPLEMENTEDWARNING: natureModifier in setupMonStats");
        stats.atk = ((2 * stats.atk + ivs.atk + evs.atk) * level / 100 + 500) * natureModifier;
        stats.def = ((2 * stats.def + ivs.def + evs.def) * level / 100 + 500) * natureModifier;
        stats.spatk = ((2 * stats.spatk + ivs.spatk + evs.spatk) * level / 100 + 500) * natureModifier;
        stats.spdef = ((2 * stats.spdef + ivs.spdef + evs.spdef) * level / 100 + 500) * natureModifier;
        stats.speed = ((2 * stats.speed + ivs.speed + evs.speed) * level / 100 + 500) * natureModifier;
        return stats;
    }

    function setupMon(uint randomNumber,
                      uint speciesId,
                      uint level,
                      uint[4] memory moveset,
                      uint id)
        private
    {
        uint nature;
        uint gender;
        MonLib.Stats memory evs;
        MonLib.Stats memory ivs;
        (ivs,randomNumber) = setupMonIvs(randomNumber);
        (nature,randomNumber) = getAndConsumeRandomBits(randomNumber, 5);
        (gender,randomNumber) = getAndConsumeRandomBits(randomNumber, 1);
        uint[4] memory currentPP = [uint(0), 0, 0, 0];
        for (uint i = 0; i < 4; ++i) {
            currentPP[i] = _moves.idToPP(moveset[i]);
        }
        idToSpecies[id] = speciesId;
        idToLevel[id] = level;
        idToNature[id] = nature;
        idToGender[id] = gender;
        idToExp[id] = 0;
        idToPP[id] = currentPP;
        idToMoveset[id] = moveset;
        idToIV[id] = ivs;
        idToEV[id] = evs;
        idToStats[id] = setupMonStats(level, speciesId, ivs, evs);
        idToHP[id] = idToStats[id].hp;
    }

    function getLatestMon(address addr)
        public view
        returns (uint) {
        return ownerToLatestMon[addr];
    }
}
