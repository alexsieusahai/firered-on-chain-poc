const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const speciesIdToName = require(__dirname + '/../data/dex.json');

// this is essentially our "server account"
var hhProvider = new ethers.providers.WebSocketProvider("http://127.0.0.1:8545");
const hhAcc10Signer = new ethers.Wallet('0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897', hhProvider);

class Chain {
    constructor() {
        this.contracts = {};
        console.warn("loading contracts from memory...");
        this.loadContracts().then(() => console.log("loaded all contracts!"));
    }

    setSignerAddress(addr) {
        this.signerAddress = addr;
        console.log('chain set signerAddress', this.signerAddress);
    }

    async loadContracts() {
        var contractsJSON = JSON.parse(fs.readFileSync(__dirname + "/../contracts.json"));
        this.contracts = {};

        const signer = hhProvider.getSigner();
        for (var key in contractsJSON) {
            contractsJSON[key]["artifact"] = JSON.parse(contractsJSON[key]["artifact"]);
            this.contracts[key] = new ethers.Contract(
                contractsJSON[key]["address"],
                contractsJSON[key]["artifact"].abi,
                (key === 'Battle') ? hhAcc10Signer : signer,
            );
            console.log("loaded contract with key", key);
        }
    }

    async callGreet() {
        return await this.contracts["Greeter"].greet();
    }

    async getRandom() {
        console.log("getting random number");
        return await this.contracts["DumbRandom"].getRandom();
    }

    async getWildMon() {
        const tx = await this.contracts["MonNFT"].mintWildMon(this.signerAddress, 0);
        await tx.wait();
        await this.contracts["Battle"].connect(hhAcc10Signer).startBattleWild(this.signerAddress);
    }

    async getParty() {
        var party = await this.contracts["MonManager"].getParty(this.signerAddress);
        return {"mons" : party, "names" : party.map(x => speciesIdToName[x.speciesId])};
    }

    async getPartyAI() {
        var party = await this.contracts["MonManager"].getPartyAI(this.signerAddress);
        return {"mons" : party, "names" : party.map(x => speciesIdToName[x.speciesId])};
    }

    async battleIngestAction(action, slot) {
        await this.contracts["Battle"].connect(hhAcc10Signer).ingestAction(this.signerAddress, action, slot);
    }

    async inBattle() {
        return await this.contracts["Battle"].inBattle(this.signerAddress);
    }

    async getInventory() {
        console.log('getting inventory from chain...');
        return await this.contracts["Item"].getInventory(this.signerAddress);
    }
}

module.exports = { Chain };
