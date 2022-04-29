pragma solidity ^0.8.0;

import "./MonNFT.sol";
import "./MonManager.sol";
import "./Constants.sol";
import "./MonTypes.sol";

contract Battle {
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
    MonNFT _monNFT;
    MonManager _monManager;
    Moves _moves;
    MonTypes _monTypes;

    constructor(MonNFT monNFT, MonManager monManager, Moves moves, MonTypes monTypes) {
        _monNFT = monNFT;
        _monManager = monManager;
        _moves = moves;
        _monTypes = monTypes;
    }

    function startBattleHuman(address opponent) public {
        require(false, "NotImplemented");
    }

    function startBattleWild() public {
        opponent[msg.sender] = address(this);
        aiStrategy[msg.sender] = WILD_AI;
        _monManager.setPartyMemberAI(msg.sender, 0, _monNFT.getLatestMon(msg.sender));
    }

    function startBattleAITrainer() public {
        require(false, "NotImplemented");
    }

    function ingestAction(uint action, uint slot) public {
        /*
         We can
         action=1 (Attack)
         action=2 (Item)
         action=3 (Party)
         action=4 (Run)
         */
        if (aiStrategy[msg.sender] > 0) {
            AIAction();
        }

        require(opponent[msg.sender] != address(0), "this account is not currently in a battle");
        require(action > 0 && action <= NUM_ACTIONS, "action selected out of bounds");

        // handle fainted mon case
        bool faintedMonCase = false;
        if (_monNFT.idToHP(_monManager.addressToParty(msg.sender, 0)) == 0) {
            require(action == PARTY_ACTION, "current mon has fainted; need to switch to a healthy mon");
            faintedMonCase = true;
        }

        playerAction[msg.sender] = action;
        playerSlot[msg.sender] = slot;

        if (aiStrategy[msg.sender] == 0) {
            // would have to see if the other player has acted
            // and if they have, then play the turn out
            require(false, "NotImplemented");
        } else {
            // AI has already acted
            console.log("NOTIMPLEMENTEDWARNING: fainted mon case not properly handled");
            handleTurnAI();
        }

        if (finishBattleCheck()) {
            finishBattle();
        }
    }

    function finishBattleCheck()
        private view
        returns (bool) {
        bool allFainted = true;
        // player party check
        for (uint i = 0; i < Constants.PARTY_SIZE; ++i) {
            if (_monNFT.idToHP(_monManager.addressToParty(msg.sender, i)) > 0) {
                allFainted = false;
            }
        }
        if (allFainted) {
            return true;
        }
        allFainted = true;
        // ai party check
        for (uint i = 0; i < Constants.PARTY_SIZE; ++i) {
            if (_monNFT.idToHP(_monManager.addressToPartyAI(msg.sender, i)) > 0) {
                allFainted = false;
            }
        }
        return allFainted;
    }

    function finishBattle() private {
        // https://bulbapedia.bulbagarden.net/wiki/Experience#Experience_gain_in_battle

        // hand out rewards
        console.log("NOTIMPLEMENTEDWARNING: finishBattle missing pokedollar handout");

        // teardown the battle
        address opponentAddress = opponent[msg.sender];
        opponent[msg.sender] = address(0);
        opponent[opponentAddress] = address(0);
        aiStrategy[msg.sender] = 0;
    }

    function handleMonFaintExpEV(uint attackerId, uint defenderId)
        private
    {
        // ev gain
        console.log("NOTIMPLEMENTEDWARNING: ev table lookup needed");
        _monNFT.incrementEV(attackerId, 0, 0, 0, 0, 0, 1);

        // exp gain
        console.log("NOTIMPLEMENTEDWARNING: trainer mons should hand out more exp");
        console.log("NOTIMPLEMENTEDWARNING: base experience table lookup needed");
        uint baseExp = 50; // pidgey default
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

    function playerDoAction() private {
        uint playerMonId = _monManager.addressToParty(msg.sender, 0);
        uint aiMonId = _monManager.addressToPartyAI(msg.sender, 0);

        if (_monNFT.idToHP(playerMonId) > 0)
            {
                if (playerAction[msg.sender] == ATTACK_ACTION) {
                    doAttack(playerMonId,
                             playerSlot[msg.sender],
                             aiMonId);
                } else if (playerAction[msg.sender] == PARTY_ACTION) {
                    _monManager.swapPartyMember(msg.sender, 0, playerSlot[msg.sender]);
                } else if (playerAction[msg.sender] == RUN_ACTION) {
                    if (opponent[msg.sender] == address(this) && aiStrategy[msg.sender] != 1) {
                        console.log("NOTIMPLEMENTED: trainer flees not allowed, tell the frontend somehow...");
                    } else {
                        console.log("fleeing...");
                        console.log("NOTIMPLEMENTED: fleeing as forfeit for player-player battles not implemented");
                        finishBattle();
                    }
                }
                else {
                    require(false, "NotImplemented");
                }
            }
    }

    function AIDoAction() private {
        uint aiMonId = _monManager.addressToPartyAI(msg.sender, 0);
        // opponent[msg.sender] == address(this) is if player has fled
        if (_monNFT.idToHP(aiMonId) > 0 && opponent[msg.sender] == address(this))
            {
                if (aiAction[msg.sender] == ATTACK_ACTION) {
                    doAttack(aiMonId,
                             aiSlot[msg.sender],
                             _monManager.addressToParty(msg.sender, 0));
                } else {
                    require(false, "NotImplemented");
                }
            }
    }

    function handleTurnAI() private {
        // player's actions are held in playerAction, playerSlot
        // opponent (AI) actions are held in aiAction, aiSlot

        require(aiStrategy[msg.sender] == 1, "only wild mon case is implemented");


        uint playerMonId = _monManager.addressToParty(msg.sender, 0);
        uint pspeed;
        (,,,,,pspeed) = _monNFT.idToStats(playerMonId);
        if (playerAction[msg.sender] != ATTACK_ACTION) {
            pspeed = 1000; // priority
        }

        uint aiMonId = _monManager.addressToPartyAI(msg.sender, 0);
        uint wspeed;
        (,,,,,wspeed) = _monNFT.idToStats(aiMonId);
        if (aiAction[msg.sender] != ATTACK_ACTION) {
            wspeed = 1000; // priority
        }

        // figure out who moves first
        if (pspeed >= wspeed) {
            playerDoAction();
            AIDoAction();
        } else {
            AIDoAction();
            playerDoAction();
        }
    }

    function AIAction() internal {
        // wild pokemon strategy; just randomly select 1 of 4 moves
        if (aiStrategy[msg.sender] == 1) {
            aiAction[msg.sender] = 1;
            aiSlot[msg.sender] = block.timestamp % 4;
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
