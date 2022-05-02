const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployContracts(testObj) {
    const DumbRandom = await ethers.getContractFactory("DumbRandom");
    testObj.dumbRandom = await DumbRandom.deploy();
    await testObj.dumbRandom.deployed();

    const MonBaseStats = await ethers.getContractFactory("MonBaseStats");
    testObj.monBaseStats = await MonBaseStats.deploy();
    await testObj.monBaseStats.deployed();

    const Moves = await ethers.getContractFactory("Moves");
    testObj.moves = await Moves.deploy();
    await testObj.moves.deployed();

    const MonCoin = await ethers.getContractFactory("MonCoin");
    testObj.monCoin = await MonCoin.deploy();
    await testObj.monCoin.deployed();

    const MonNFT = await ethers.getContractFactory("MonNFT");
    testObj.monNFT = await MonNFT.deploy(testObj.dumbRandom.address,
                                        testObj.monBaseStats.address,
                                        testObj.moves.address,
                                        testObj.monCoin.address);
    await testObj.monNFT.deployed();

    const MonManager = await ethers.getContractFactory("MonManager");
    testObj.monManager = await MonManager.deploy(
        testObj.monNFT.address, testObj.moves.address);
    await testObj.monManager.deployed();

    const MonTypes = await ethers.getContractFactory("MonTypes");
    testObj.monTypes = await MonTypes.deploy(testObj.moves.address);
    await testObj.monTypes.deployed();

    const Item = await ethers.getContractFactory("Item");
    testObj.item = await Item.deploy(testObj.monNFT.address, testObj.monManager.address);
    await testObj.item.deployed();

    const Battle = await ethers.getContractFactory("Battle");
    testObj.battle = await Battle.deploy(
        testObj.monNFT.address,
        testObj.monManager.address,
        testObj.moves.address,
        testObj.monTypes.address,
        testObj.monCoin.address,
        testObj.item.address);
    await testObj.battle.deployed();

    await testObj.item.addServerAddress(testObj.user0.address);

    await testObj.battle.addServerAddress(testObj.user0.address);

    await testObj.monManager.addServerAddress(testObj.user0.address);

    await testObj.monNFT.setBattleAddress(testObj.battle.address);
    await testObj.monNFT.setItemAddress(testObj.item.address);

    await testObj.monManager.setBattleAddress(testObj.battle.address);

    await testObj.monCoin.setBattleAddress(testObj.battle.address);
    await testObj.monCoin.setMonNFTAddress(testObj.monNFT.address);
}

async function monSetup(testObj) {
    await testObj.monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500); // bulbasaur
    await testObj.monBaseStats.setStats(16, 4000, 4500, 4000, 3500, 3500, 5600); // pidgey
    await testObj.moves.addInfo("Tackle", 0, true, 40, 100, 35, true);
    await testObj.monTypes.deployed();
    await testObj.monTypes.addSpecies(1, [3]);
    await testObj.monTypes.addSpecies(16, [0, 9]);
    await testObj.battle.addSpeciesIdToExp(1, 50); // bulbasaur base exp is 50
    await testObj.battle.addSpeciesIdToExp(16, 50); // pidgey base exp is 50
    await testObj.battle.addSpeciesIdToEV(16, [0, 0, 0, 0, 0, 1]);
}

async function setupUsers(testObj) {
    const [user0, user1] = await ethers.getSigners();
    testObj.user0 = user0;
    testObj.user1 = user1;
}

module.exports = { deployContracts, monSetup, setupUsers };
