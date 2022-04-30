const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployContracts, monSetup, setupUsers } = require("./common_setup.js");

describe("MonNFT", function () {
    it("wild encounter mint example", async function () {
        await deployContracts(this);
        await monSetup(this);
        await setupUsers(this);

        var id = await this.monNFT.mintWildMon(this.user0.address, 0);
    });

    it("bulbasaur mint example", async function () {
        await deployContracts(this);
        await monSetup(this);
        await setupUsers(this);

        this.monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0);
        await this.monNFT.idToSpecies(1);
    });
});
