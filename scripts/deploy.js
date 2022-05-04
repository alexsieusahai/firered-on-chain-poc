const { ethers } = require("hardhat");
const fs = require('fs');

var hhProvider = new ethers.providers.WebSocketProvider("http://127.0.0.1:8545");
// this is hardhat acc #10 on localhost
const serverSigner = new ethers.Wallet('0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897', hhProvider);

// https://github.com/filipekiss/pokemon-type-chart/blob/master/types.json#L8
function nameToId(name) {
    switch(name) {
    case "Normal":
        return 0;
    case "Fire":
        return 1;
    case "Water":
        return 2;
    case "Grass":
        return 3;
    case "Electric":
        return 4;
    case "Ice":
        return 5;
    case "Fighting":
        return 6;
    case "Poison":
        return 7;
    case "Ground":
        return 8;
    case "Flying":
        return 9;
    case "Psychic":
        return 10;
    case "Bug":
        return 11;
    case "Rock":
        return 12;
    case "Ghost":
        return 13;
    case "Dragon":
        return 14;
    case "Dark":
        return 15;
    case "Steel":
        return 16;
    default:
        console.warn("nameToId is returning an unsupported value; name passed in was", name);
        return 0;
    }
}

class Deploy {
    constructor() {
        this.contracts = {};
    }

    async deployContracts() {
        const Greeter = await ethers.getContractFactory("Greeter");
        var greeter = await Greeter.deploy("Hello, world!");
        await this.saveContract("Greeter", greeter);

        const DumbRandom = await ethers.getContractFactory("DumbRandom");
        var dumbRandom = await DumbRandom.deploy();
        await this.saveContract("DumbRandom", dumbRandom);

        const MonBaseStats = await ethers.getContractFactory("MonBaseStats");
        this.monBaseStats = await MonBaseStats.deploy();
        await this.saveContract("MonBaseStats", this.monBaseStats);

        const Moves = await ethers.getContractFactory("Moves");
        this.moves = await Moves.deploy();
        await this.saveContract("Moves", this.moves);

        const MonCoin = await ethers.getContractFactory("MonCoin");
        this.monCoin = await MonCoin.deploy();
        await this.saveContract("MonCoin", this.monCoin);

        const MonNFT = await ethers.getContractFactory("MonNFT");
        this.monNFT = await MonNFT.deploy(dumbRandom.address,
                                          this.monBaseStats.address,
                                          this.moves.address,
                                          this.monCoin.address);
        await this.saveContract("MonNFT", this.monNFT);

        const MonTypes = await ethers.getContractFactory("MonTypes");
        this.monTypes = await MonTypes.deploy(this.moves.address);
        await this.saveContract("MonTypes", this.monTypes);

        const MonManager = await ethers.getContractFactory("MonManager");
        this.monManager = await MonManager.deploy(this.monNFT.address, this.moves.address);
        await this.saveContract("MonManager", this.monManager);

        const Item = await ethers.getContractFactory("Item");
        this.item = await Item.deploy(this.monNFT.address, this.monManager.address);
        await this.saveContract("Item", this.item);

        const Battle = await ethers.getContractFactory("Battle");
        this.battle = await Battle.deploy(this.monNFT.address,
                                          this.monManager.address,
                                          this.moves.address,
                                          this.monTypes.address,
                                          this.monCoin.address,
                                          this.item.address);
        await this.battle.deployed();

        await this.item.addServerAddress(serverSigner.address);
        await this.battle.addServerAddress(serverSigner.address);
        await this.monManager.addServerAddress(serverSigner.address);
        await this.monCoin.setMonNFTAddress(this.monNFT.address);
        await this.monCoin.setBattleAddress(this.battle.address);
        await this.monNFT.setBattleAddress(this.battle.address);
        await this.monManager.setBattleAddress(this.battle.address);
        await this.saveContract("Battle", this.battle);
    }

    async setBaseStats() {
        // setup all of the stats for everything
        await this.monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        await this.monBaseStats.setStats(4, 4400, 4800, 6500, 5000, 6400, 4300);
        await this.monBaseStats.setStats(7, 3900, 5200, 4300, 6000, 5000, 6500);
        await this.monBaseStats.setStats(16, 4000, 4500, 4000, 3500, 3500, 5600);
        console.log('setup base stat mocks!');
    }

    async setMonTypes() {
        await this.monTypes.addSpecies(1, [3]);
        await this.monTypes.addSpecies(4, [2]);
        await this.monTypes.addSpecies(7, [1]);
        await this.monTypes.addSpecies(16, [0, 9]);
        console.log("setup mon type mocks!");
    }

    async setMoves() {
        var movesJson = JSON.parse(fs.readFileSync(__dirname + "/../data/moves.json"));
        for (var i in movesJson) {
            var move = movesJson[i];
            await this.moves.addInfo(move[0],
                                     nameToId(move[1]),
                                     move[2],
                                     move[4],
                                     move[5],
                                     move[3],
                                     true);
        }
        console.log('added moves!');
    }

    async setTypeChart() {
        var typeChartJson = JSON.parse(fs.readFileSync(__dirname + "/types.json"));
        var type0, type1;
        for (var i in typeChartJson)
        {
            type0 = nameToId(typeChartJson[i].name);
            var j;
            for (j in typeChartJson[i].immunes) {
                type1 = nameToId(typeChartJson[i].immunes[j]);
                await this.moves.addMultiplier(type0, type1, 0);
            }
            for (j in typeChartJson[i].weaknesses) {
                type1 = nameToId(typeChartJson[i].weaknesses[j]);
                await this.moves.addMultiplier(type0, type1, 5);
            }
            for (j in typeChartJson[i].strengths) {
                type1 = nameToId(typeChartJson[i].strengths[j]);
                await this.moves.addMultiplier(type0, type1, 20);
            }
        }
        console.log("setup type chart!");
    }

    async setupExpTable() {
        var expTableJson = JSON.parse(fs.readFileSync(__dirname + "/../data/exp.json"));
        for (var i in expTableJson) {
            await this.battle.addSpeciesIdToExp(i, expTableJson[i]);
        }
        console.log('setup exp table!');
    }

    async setupEVTable() {
        var evTableJson = JSON.parse(fs.readFileSync(__dirname + "/../data/ev.json"));
        for (var i in evTableJson) {
            await this.battle.addSpeciesIdToEV(i, evTableJson[i]);
        }
        console.log('setup ev table!');
    }

    async setupUser() {
        [this.user] = await ethers.getSigners();

        // give user LINK
        // set up VRF rng
        // see
        // https://hardhat.org/hardhat-network/guides/mainnet-forking.html
        // for how to do this with alchemy
        // for now, just use dumbrandom

        // mint starters for the user
        // give all mons Pound, Ice Punch, Karate Chop
        await this.monNFT.mintSpeciesMon(this.user.address, 1, 5, 1, 8, 2, 22);
        await this.monNFT.mintSpeciesMon(this.user.address, 4, 5, 1, 8, 2, 22);
        await this.monNFT.mintSpeciesMon(this.user.address, 7, 5, 1, 8, 2, 22);
        await this.monManager.connect(serverSigner).setPartyMember(this.user.address, 0, 1);
        await this.monManager.connect(serverSigner).setPartyMember(this.user.address, 1, 2);
        await this.monManager.connect(serverSigner).setPartyMember(this.user.address, 2, 3);
        console.log('setup user!');
    }

    async setupNPCMons() {
        // we can use mintSpeciesMon for now, and give Battle.sol the mons
        await this.monNFT.mintSpeciesMon(this.battle.address, 1, 3, 1, 0, 0, 0);
        console.log('setup npc mons!');
    }

    async setupInitialItems() {
        // initially give 10 potions to user, for testing purposes
        await this.item.connect(serverSigner).giveItem(this.user.address, 1, 10);
        console.log('setup initial test items!');
    }

    async deploy() {
        if (network.name === "hardhat") {
            console.warn("deploying to hardhat network; nothing will persist...");
        }

        await this.deployContracts();
        await this.setBaseStats();
        await this.setMonTypes();
        await this.setMoves();
        await this.setTypeChart();
        await this.setupUser();
        await this.setupNPCMons();
        await this.setupExpTable();
        await this.setupEVTable();
        await this.setupInitialItems();

        fs.writeFileSync(
            __dirname + "/../contracts.json",
            JSON.stringify(this.contracts));
    }

    saveContract(name, contract) {
        this.contracts[name] = {};
        this.contracts[name]["artifact"] = JSON.stringify(
            artifacts.readArtifactSync(name), null, 2);
        this.contracts[name]["address"] = contract.address;
    }
}

var deploy = new Deploy();
deploy.deploy().then(() => {
    console.log("finished deployment!");
    process.exit(0);
});
