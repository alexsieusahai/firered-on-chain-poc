pragma solidity ^0.8.0;

import "./MonNFT.sol";
import "./MonManager.sol";
import "./Constants.sol";
import "./MonTypes.sol";
import "./MonCoin.sol";
import "./ServerOwnable.sol";
import "./Item.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract Battle is Ownable, ServerOwnable {
    /*
     Handles on-chain battling between two parties.
     TODO VRF instead of block.timestamp?
     */

    uint constant NUM_ACTIONS = 4;
    uint constant ATTACK_ACTION = 1;
    uint constant ITEM_ACTION = 2;
    uint constant PARTY_ACTION = 3;
    uint constant RUN_ACTION = 4;
    uint constant WILD_AI = 1;
    mapping(address => address) opponent; // if opponent is address(this), that means it's fighting some AI
    mapping(address => uint) playerAction;
    mapping(address => uint) playerSlot;
    mapping(address => uint) aiStrategy;
    mapping(address => uint) aiAction;
    mapping(address => uint) aiSlot;
    mapping(address => uint) coinReward;
    mapping(uint => uint) speciesIdToExp;
    mapping(uint => uint[]) speciesIdToEV;
    MonNFT _monNFT;
    MonManager _monManager;
    Moves _moves;
    MonTypes _monTypes;
    MonCoin _monCoin;
    Item _item;

    constructor(MonNFT monNFT,
                MonManager monManager,
                Moves moves,
                MonTypes monTypes,
                MonCoin monCoin,
                Item item) {
        _monNFT = monNFT;
        _monManager = monManager;
        _moves = moves;
        _monTypes = monTypes;
        _monCoin = monCoin;
        _item = item;
    }

    function addSpeciesIdToExp(uint speciesId, uint exp)
    public onlyOwner {
        speciesIdToExp[speciesId] = exp;
    }

    function addSpeciesIdToEV(uint speciesId, uint[] memory evs)
        public onlyOwner {
        require(evs.length == 6, "EVs passed in are not of the correct size, should be 6 EVs");
        speciesIdToEV[speciesId] = evs;
    }

    function startBattleHuman(address opp) public {
        require(false, "NotImplemented");
    }

    function startBattleWild(address addr)
        public onlyServer {
        opponent[addr] = address(this);
        aiStrategy[addr] = WILD_AI;
        _monManager.setPartyMemberAI(addr, 0, _monNFT.getLatestMon(addr));
    }

    function startBattleAITrainer(address addr, uint[] memory monIds, uint coin) public {
        // Generates copies of all passed in mons, and begins a battle with the addr with those mon clones.
        opponent[addr] = address(this);
        console.log("NOTIMPLEMENTED: trainer AI; just using WILD_AI for now");
        aiStrategy[addr] = WILD_AI;
        uint[] memory enemyIds;
        for (uint i = 0; i < monIds.length; ++i) {
            _monManager.setPartyMemberAI(addr, i, _monNFT.cloneMon(monIds[i]));
        }
        coinReward[addr] = coin;
    }

    function ingestAction(address addr, uint action, uint slot)
        public onlyServer {
        /*
         We can
         action=1 (Attack)
         action=2 (Item)
         action=3 (Party)
         action=4 (Run)
         */
        if (aiStrategy[addr] > 0) {
            AIAction(addr);
        }

        require(opponent[addr] != address(0), "this account is not currently in a battle");
        require(action > 0 && action <= NUM_ACTIONS, "action selected out of bounds");

        // handle fainted mon case
        bool faintedMonCase = false;
        if (_monNFT.idToHP(_monManager.addressToParty(addr, 0)) == 0) {
            require(action == PARTY_ACTION, "current mon has fainted; need to switch to a healthy mon");
            faintedMonCase = true;
        }

        playerAction[addr] = action;
        playerSlot[addr] = slot;

        if (aiStrategy[addr] == 0) {
            // would have to see if the other player has acted
            // and if they have, then play the turn out
            require(false, "NotImplemented");
        } else {
            // AI has already acted
            console.log("NOTIMPLEMENTEDWARNING: fainted mon case not properly handled");
            handleTurnAI(addr);
        }

        if (finishBattleCheck(addr)) {
            finishBattle(addr);
        }
    }

    function finishBattleCheck(address addr)
        private view
        returns (bool) {
        bool allFainted = true;
        // player party check
        for (uint i = 0; i < Constants.PARTY_SIZE; ++i) {
            if (_monNFT.idToHP(_monManager.addressToParty(addr, i)) > 0) {
                allFainted = false;
            }
        }
        if (allFainted) {
            return true;
        }
        allFainted = true;
        // ai party check
        for (uint i = 0; i < Constants.PARTY_SIZE; ++i) {
            if (_monNFT.idToHP(_monManager.addressToPartyAI(addr, i)) > 0) {
                allFainted = false;
            }
        }
        return allFainted;
    }

    function finishBattle(address addr) private {
        _monCoin.postBattleCoins(addr, coinReward[addr]);
        coinReward[addr] = 0;

        // teardown the battle
        address opponentAddress = opponent[addr];
        opponent[addr] = address(0);
        opponent[opponentAddress] = address(0);
        aiStrategy[addr] = 0;
    }

    function handleMonFaintExpEV(uint attackerId, uint defenderId)
        private
    {
        // ev gain
        uint[] memory evs = speciesIdToEV[_monNFT.idToSpecies(defenderId)];
        require(evs.length == 6, "The species corresponding to defenderId has not been added to the EV table.");
        _monNFT.incrementEV(attackerId, evs[0], evs[1], evs[2], evs[3], evs[4], evs[5]);

        // exp gain
        console.log("NOTIMPLEMENTEDWARNING: trainer mons should hand out more exp");
        uint baseExp = speciesIdToExp[_monNFT.idToSpecies(defenderId)];
        require(baseExp > 0, "The species corresponding to defenderId has not been added to the Exp table.");
        uint wildMultiplier = 10;
        uint deltaExp = baseExp * wildMultiplier * _monNFT.idToLevel(defenderId) / 70;
        _monNFT.incrementExp(attackerId, deltaExp);
    }

    function damageAttackDefRatio(uint attackerId, uint defenderId, bool isPhysical)
        private
        returns (uint)
    {
        uint patk;
        uint pspatk;
        uint wdef;
        uint wspdef;
        (,patk,,pspatk,,) = _monNFT.idToStats(attackerId);
        (,,wdef,,wspdef,) = _monNFT.idToStats(defenderId);
        return (isPhysical ? patk : pspatk) * 100 / (isPhysical ? wdef : wspdef);
    }

    function doAttack(uint attackerId, uint moveSlot, uint defenderId) private {
        // https://bulbapedia.bulbagarden.net/wiki/Damage
        // keep in mind that all stats are inflated by 100 to prevent rounding errors
        bool isPhysical;
        uint power;
        uint accuracy;
        uint moveType;
        (,moveType,isPhysical,power,accuracy,,) = _moves.idToMove(_monNFT.idToMoveset(attackerId, moveSlot));
        console.log("NOTIMPLEMENTEDWARNING: need to check and handle PP for attacks");

        uint damage = 2 * _monNFT.idToLevel(attackerId) * 100 / 5 + 200; // extra multiplier of 100 (absorbed by hp being 100x the normal amount)
        damage = damage * power * damageAttackDefRatio(attackerId, defenderId, isPhysical); // extra multiplier of 100
        damage /= 50;
        damage += 20000;
        console.log("NOTIMPLEMENTEDWARNING: block.timestamp randomness");
        damage = damage * (block.timestamp % 38 + 217) / 255; // see random factor ; not *= to avoid rounding errors
        damage *= (block.timestamp % 16 == 0 ? 2 : 1); // critical hit chance
        damage *= _monTypes.typeDamageMultiplier(_monNFT.idToSpecies(defenderId), moveType); // extra multiplier of 10;
        damage *= _monTypes.STABMultiplier(_monNFT.idToSpecies(attackerId), moveType); // extra multiplier of 10
        damage /= 10000;
        console.log("damage dealt", damage);
        console.log("hp before attack", _monNFT.idToHP(defenderId));
        _monNFT.deductHP(defenderId, damage);
        console.log("hp remaining", _monNFT.idToHP(defenderId));

        // handle fainted mon case for exp and ev
        if (_monNFT.idToHP(defenderId) == 0) {
            handleMonFaintExpEV(attackerId, defenderId);
        }
    }

    function playerDoAction(address addr) private {
        uint playerMonId = _monManager.addressToParty(addr, 0);
        uint aiMonId = _monManager.addressToPartyAI(addr, 0);

        if (_monNFT.idToHP(playerMonId) > 0)
            {
                if (playerAction[addr] == ATTACK_ACTION) {
                    doAttack(playerMonId,
                             playerSlot[addr],
                             aiMonId);
                } else if (playerAction[addr] == PARTY_ACTION) {
                    _monManager.swapPartyMember(addr, 0, playerSlot[addr]);
                } else if (playerAction[addr] == RUN_ACTION) {
                    if (opponent[addr] == address(this) && aiStrategy[addr] != 1) {
                        console.log("NOTIMPLEMENTED: trainer flees not allowed, tell the frontend somehow...");
                    } else {
                        console.log("fleeing...");
                        console.log("NOTIMPLEMENTED: fleeing as forfeit for player-player battles not implemented");
                        finishBattle(addr);
                    }
                }
                else {
                    require(false, "NotImplemented");
                }
            }
    }

    function AIDoAction(address addr) private {
        uint aiMonId = _monManager.addressToPartyAI(addr, 0);
        // opponent[addr] == address(this) is if player has fled
        if (_monNFT.idToHP(aiMonId) > 0 && opponent[addr] == address(this))
            {
                if (aiAction[addr] == ATTACK_ACTION) {
                    doAttack(aiMonId,
                             aiSlot[addr],
                             _monManager.addressToParty(addr, 0));
                } else {
                    require(false, "NotImplemented");
                }
            }
    }

    function handleTurnAI(address addr) private {
        // player's actions are held in playerAction, playerSlot
        // opponent (AI) actions are held in aiAction, aiSlot

        require(aiStrategy[addr] == 1, "only wild mon case is implemented");


        uint playerMonId = _monManager.addressToParty(addr, 0);
        uint pspeed;
        (,,,,,pspeed) = _monNFT.idToStats(playerMonId);
        if (playerAction[addr] != ATTACK_ACTION) {
            pspeed = 1000; // priority
        }

        uint aiMonId = _monManager.addressToPartyAI(addr, 0);
        uint wspeed;
        (,,,,,wspeed) = _monNFT.idToStats(aiMonId);
        if (aiAction[addr] != ATTACK_ACTION) {
            wspeed = 1000; // priority
        }

        // figure out who moves first
        if (pspeed >= wspeed) {
            playerDoAction(addr);
            AIDoAction(addr);
        } else {
            AIDoAction(addr);
            playerDoAction(addr);
        }
    }

    function AIAction(address addr) internal {
        // wild pokemon strategy; just randomly select 1 of 4 moves
        if (aiStrategy[addr] == 1) {
            aiAction[addr] = 1;
            aiSlot[addr] = block.timestamp % 4;
        } else {
            require(false, "NotImplemented");
        }
    }

    function inBattle(address addr)
        public view
        returns (bool)
    {
        return opponent[addr] != address(0);
    }
}
