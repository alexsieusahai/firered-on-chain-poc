export function makeMonObject(monArray) {
    function convert(bignum) {
        return Number(bignum.hex);
    }
    return {
        "speciesId": convert(monArray[0]),
        "currentHP": convert(monArray[1]),
        "maxHP": convert(monArray[2]),
        "level": convert(monArray[3]),
        "gender": convert(monArray[4]),
        "moveset": monArray[5].map(x => x === '' ? '-' : x),
        "movesetTypes": monArray[6].map(convert),
        "currentPP": monArray[7].map(convert),
        "maxPP": monArray[8].map(convert),
        "currentExp": convert(monArray[9]),
        "levelRequirement": convert(monArray[10])
    };
}

export function getTypeString(typeInt) {
    console.warn("type string should just be a JSON file");
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
