pragma solidity ^0.8.0;

import "./MonNFT.sol";
import "./MonLib.sol";
import "./Constants.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract MonManager is Ownable {
    /*
     This should handle party and storage.
     This also holds NPC AI parties.
     */
    MonNFT private _monNFT;
    Moves private _moves;
    address _battleAddress;
    // user => party member slot => id
    mapping(address => mapping(uint => uint)) public addressToParty;
    // user => party member slot => id (AI mons)
    mapping(address => mapping(uint => uint)) public addressToPartyAI;
    // user => storage slot => id
    mapping(address => mapping(uint => uint)) public addressToStorage;

    constructor(MonNFT monNFT, Moves moves) {
        _monNFT = monNFT;
        _moves = moves;
    }

    modifier onlyMonOwner(uint id) {
        require(_monNFT.idToOwner(id) == msg.sender, "Only the owner of the mon can add it to the party.");
        _;
    }

    modifier onlyBattle {
        require(msg.sender == _battleAddress, "Only battle is allowed to call this");
        _;
    }

    function setBattleAddress(address addr)
        public onlyOwner
    {
        _battleAddress = addr;
    }

    function getMon(uint id)
        public view
        returns (MonLib.BattleMon memory)
    {
        string[4] memory movesetNames;
        uint[4] memory movesetTypes;
        uint[4] memory maxPParr;
        string memory name;
        uint moveType;
        uint maxPP;
        for (uint i = 0; i < 4; ++i)
            {
                (name,moveType,,,,maxPP,) = _moves.idToMove(_monNFT.idToMoveset(id, i));
                movesetNames[i] = name;
                movesetTypes[i] = moveType;
                maxPParr[i] = maxPP;
            }
        uint maxHP;
        (maxHP,,,,,) = _monNFT.idToStats(id);
        return MonLib.BattleMon(_monNFT.idToSpecies(id),
                                _monNFT.idToHP(id),
                                maxHP,
                                _monNFT.idToLevel(id),
                                _monNFT.idToGender(id),
                                movesetNames,
                                movesetTypes,
                                [_monNFT.idToPP(id, 0),
                                 _monNFT.idToPP(id, 1),
                                 _monNFT.idToPP(id, 2),
                                 _monNFT.idToPP(id, 3)],
                                maxPParr
                                );
    }

    function getParty(address addr)
        public view
        returns (MonLib.BattleMon[6] memory)
    {
        MonLib.BattleMon[6] memory party;
        for (uint i = 0; i < 6; ++i) {
            party[i] = getMon(addressToParty[addr][i]);
        }
        return party;
    }

    function getPartyAI(address addr)
        public view
        returns (MonLib.BattleMon[6] memory)
    {
        MonLib.BattleMon[6] memory party;
        for (uint i = 0; i < 6; ++i) {
            party[i] = getMon(addressToPartyAI[addr][i]);
        }
        return party;
    }

    function unsetMon(uint id) private {
        // if it's in party, remove it
        for (uint i = 0; i < Constants.PARTY_SIZE; ++i) {
            if (addressToParty[msg.sender][i] == id)
                {
                    addressToParty[msg.sender][i] = 0;
                }
        }
        // if it's already in storage, remove that spot
        for (uint i = 0; i < Constants.STORAGE_SIZE; ++i)  {
            if (addressToStorage[msg.sender][i] == id)
                {
                    addressToStorage[msg.sender][i] = 0;
                }
        }
    }

    function setPartyMember(uint slot, uint id)
        public onlyMonOwner(id)
    {
        require(slot >= 0 && slot < Constants.PARTY_SIZE);
        require(addressToParty[msg.sender][slot] == 0, "Party slot not empty!");
        unsetMon(id);
        addressToParty[msg.sender][slot] = id;
    }

    function setPartyMemberAI(address addr, uint slot, uint id)
        public onlyBattle
    {
        require(slot >= 0 && slot < Constants.PARTY_SIZE);
        console.log("TESTING-WARNING: disabled setpartymemberai check for easier debugging");
        /* require(addressToPartyAI[addr][slot] == 0, "Party slot not empty! (AI)"); */
        addressToPartyAI[addr][slot] = id;
    }

    function setStorage(uint slot, uint id)
        public onlyMonOwner(id)
    {
        require(slot >= 0 && slot < Constants.STORAGE_SIZE);
        require(addressToStorage[msg.sender][slot] == 0, "Storage slot not empty!");
        unsetMon(id);
        addressToStorage[msg.sender][slot] = id;
    }

    function swapPartyMember(address addr, uint slot0, uint slot1)
        public onlyBattle
    {
        uint id0 = addressToParty[addr][slot0];
        uint id1 = addressToParty[addr][slot1];
        console.log("swapping ids", id0, id1);
        require(id0 > 0 && id1 > 0, "tried to swap party members that don't exist");
        addressToParty[addr][slot0] = id1;
        addressToParty[addr][slot1] = id0;
    }
}
