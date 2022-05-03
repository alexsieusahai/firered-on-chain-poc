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
