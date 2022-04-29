const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const speciesIdToName = require(__dirname + '/../data/dex.json');

// use the test provider
var hhProvider = new ethers.providers.WebSocketProvider("http://127.0.0.1:8545");

class Chain {
    constructor() {
        this.contracts = {};
        console.warn("loading contracts from memory...");
        this.loadContracts().then(() => console.log("loaded all contracts!"));
    }

    async loadContracts() {
        var contractsJSON = JSON.parse(fs.readFileSync(__dirname + "/../contracts.json"));
        this.contracts = {};

        const signer = hhProvider.getSigner();
        console.warn("signer here certainly needs to be obtained from like metamask or something in the future...");
        for (var key in contractsJSON) {
            contractsJSON[key]["artifact"] = JSON.parse(contractsJSON[key]["artifact"]);
            this.contracts[key] = new ethers.Contract(
                contractsJSON[key]["address"],
                contractsJSON[key]["artifact"].abi,
                signer
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
        console.log("NOTIMPLEMENTEDWARNING: ethers.getSigners() used here, should be using metamask in the future...");
        const [deployer] = await ethers.getSigners();
        const tx = await this.contracts["MonNFT"].mintWildMon(deployer.address, 0);
        await tx.wait();
        await this.contracts["Battle"].startBattleWild();
    }

    async getParty() {
        console.log("NOTIMPLEMENTEDWARNING: ethers.getSigners() used here, should be using metamask in the future...");
        const [deployer] = await ethers.getSigners();
        var party = await this.contracts["MonManager"].getParty(deployer.address);
        return {"mons" : party, "names" : party.map(x => speciesIdToName[x.speciesId])};
    }

    async getPartyAI() {
        console.log("NOTIMPLEMENTEDWARNING: ethers.getSigners() used here, should be using metamask in the future...");
        const [deployer] = await ethers.getSigners();
        var party = await this.contracts["MonManager"].getPartyAI(deployer.address);
        return {"mons" : party, "names" : party.map(x => speciesIdToName[x.speciesId])};
    }

    async battleIngestAction(action, slot) {
        console.log("NOTIMPLEMENTEDWARNING: ethers.getSigners() used here, should be using metamask in the future...");
        const [deployer] = await ethers.getSigners();
        await this.contracts["Battle"].ingestAction(action, slot);
    }

    async inBattle() {
        console.log("NOTIMPLEMENTEDWARNING: ethers.getSigners() used here, should be using metamask in the future...");
        const [deployer] = await ethers.getSigners();
        return await this.contracts["Battle"].inBattle(deployer.address);
    }
}

module.exports = { Chain };
