export function makeMonObject(monArray) {
    function convert(bignum) {
        return Number(bignum.hex);
    }
    return {
        "id": convert(monArray[0]),
        "speciesId": convert(monArray[1]),
        "currentHP": convert(monArray[2]),
        "maxHP": convert(monArray[3]),
        "level": convert(monArray[4]),
        "gender": convert(monArray[5]),
        "moveset": monArray[6].map(x => x === '' ? '-' : x),
        "movesetTypes": monArray[7].map(convert),
        "currentPP": monArray[8].map(convert),
        "maxPP": monArray[9].map(convert),
        "currentExp": convert(monArray[10]),
        "levelRequirement": convert(monArray[11])
    };
}

export function getTypeString(typeInt) {
    switch (typeInt) {
    case 0:
        return "NORMAL";
    case 1:
        return "FIRE";
    case 2:
        return "WATER";
    case 3:
        return "GRASS";
    case 4:
        return "ELECTRIC";
    case 5:
        return "ICE";
    case 6:
        return "FIGHTING";
    case 7:
        return "POISON";
    case 8:
        return "GROUND";
    case 9:
        return "FLYING";
    case 10:
        return "PSYCHIC";
    case 11:
        return "BUG";
    case 12:
        return "ROCK";
    case 13:
        return "GHOST";
    case 14:
        return "DRAGON";
    case 15:
        return "DARK";
    case 16:
        return "STEEL";
    default:
        console.warn("getTypeString has encountered an invalid typeInt");
        return "?";
    }
}

export function padString(string, amount, padchar=' ') {
    return string + padchar.repeat(amount - string.length);
}
