pragma solidity ^0.8.0;

library MonLib {
    struct Stats {
        uint hp;
        uint atk;
        uint def;
        uint spatk;
        uint spdef;
        uint speed;
    }

    // a smaller version of mon that only exposes things needed for battle UI
    struct BattleMon {
        uint speciesId;
        uint currentHP;
        uint level;
        uint gender;
        string[4] moveset;
        uint[4] movesetTypes;
        uint[4] currentPP;
    }

}
