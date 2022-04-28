const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonBaseStats", function () {
    it("bulbasaur add stats example", async function () {
        const MonBaseStats = await ethers.getContractFactory("MonBaseStats");
        const monBaseStats = await MonBaseStats.deploy();
        await monBaseStats.deployed();
        monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        var baseStats = await monBaseStats.speciesIdToStats(1);
    });
});
