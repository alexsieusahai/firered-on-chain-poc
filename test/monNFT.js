const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonNFT", function () {
    it("wild encounter mint example", async function () {
        const DumbRandom = await ethers.getContractFactory("DumbRandom");
        const dumbRandom = await DumbRandom.deploy();
        await dumbRandom.deployed();

        const MonBaseStats = await ethers.getContractFactory("MonBaseStats");
        const monBaseStats = await MonBaseStats.deploy();
        await monBaseStats.deployed();

        const Moves = await ethers.getContractFactory("Moves");
        const moves = await Moves.deploy();
        await monBaseStats.deployed();

        const MonNFT = await ethers.getContractFactory("MonNFT");
        const monNFT = await MonNFT.deploy(dumbRandom.address, monBaseStats.address, moves.address);
        await monNFT.deployed();

        const [deployer] = await ethers.getSigners();

        var id = await monNFT.mintWildMon(deployer.address, 0);
    });

    it("bulbasaur mint example", async function () {
        const DumbRandom = await ethers.getContractFactory("DumbRandom");
        const dumbRandom = await DumbRandom.deploy();
        await dumbRandom.deployed();

        const MonBaseStats = await ethers.getContractFactory("MonBaseStats");
        const monBaseStats = await MonBaseStats.deploy();
        await monBaseStats.deployed();

        const Moves = await ethers.getContractFactory("Moves");
        const moves = await Moves.deploy();
        await monBaseStats.deployed();

        const MonNFT = await ethers.getContractFactory("MonNFT");
        const monNFT = await MonNFT.deploy(dumbRandom.address, monBaseStats.address, moves.address);
        await monNFT.deployed();

        const [deployer] = await ethers.getSigners();

        monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        var id = await monNFT.mintSpeciesMon(deployer.address, 1, 5, 1, 0, 0, 0);
        var mon = await monNFT.idToSpecies(1);
    });
});
