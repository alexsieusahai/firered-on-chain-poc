const { ethers } = require("hardhat");
const fs = require('fs');

var hhProvider = new ethers.providers.WebSocketProvider("http://127.0.0.1:8545");

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

        const MonNFT = await ethers.getContractFactory("MonNFT");
        this.monNFT = await MonNFT.deploy(dumbRandom.address, this.monBaseStats.address, this.moves.address);
        await this.saveContract("MonNFT", this.monNFT);

        const MonTypes = await ethers.getContractFactory("MonTypes");
        this.monTypes = await MonTypes.deploy(this.moves.address);
        await this.saveContract("MonTypes", this.monTypes);

        const MonManager = await ethers.getContractFactory("MonManager");
        this.monManager = await MonManager.deploy(this.monNFT.address, this.moves.address);
        await this.saveContract("MonManager", this.monManager);

        const Battle = await ethers.getContractFactory("Battle");
        const battle = await Battle.deploy(this.monNFT.address,
                                           this.monManager.address,
                                           this.moves.address,
                                           this.monTypes.address);
        await battle.deployed();
        await this.monNFT.setBattleAddress(battle.address);
        await this.monManager.setBattleAddress(battle.address);
        await this.saveContract("Battle", battle);
    }

    async setBaseStats() {
        // setup all of the stats for everything
        // bulbasaur mock
        await this.monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        // pidgey mock
        await this.monBaseStats.setStats(16, 4000, 4500, 4000, 3500, 3500, 5600);
    }

    async setMonTypes() {
        // bulbasaur mock
        await this.monTypes.addSpecies(1, [3]);
        // pidgey mock
        await this.monTypes.addSpecies(16, [0, 9]);
        console.log("setup mon type mocks!");
    }

    async setMoves() {
        await this.moves.addInfo("Tackle", 0, true, 40, 100, 35, true);
    }

    async setTypeChart() {
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
                console.warn("nameToId is returning an unsupported value");
                return 0;
            }
        }
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

    async setupUser() {
        [this.user] = await ethers.getSigners();

        // give user LINK
        // set up VRF rng
        // see
        // https://hardhat.org/hardhat-network/guides/mainnet-forking.html
        // for how to do this with alchemy
        // for now, just use dumbrandom

        // mint a bulbasaur for the user and put it into user's party in first slot
        await this.monNFT.mintSpeciesMon(this.user.address, 1, 5, 1, 0, 0, 0);
        await this.monManager.setPartyMember(0, 1);
    }

    async setupNPCMons() {
        // we can use mintSpeciesMon for now, and give Battle.sol the mons
        await this.monManager.mintSpeciesMon(this.battle.address, 1, 3, 1, 0, 0, 0);

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
