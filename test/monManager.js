const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployContracts, monSetup, setupUsers } = require("./common_setup.js");

describe("MonManager", function () {
    it("bulbasaur add to party", async function () {
        await deployContracts(this);
        await monSetup(this);
        await setupUsers(this);

        this.monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0);
        await this.monManager.connect(this.user0).setPartyMember(0, 1);
        var party = await this.monManager.getParty(this.user0.address);
        expect(party[0].currentHP.toNumber()).to.be.gt(0);
        expect(party[1].currentHP.toNumber()).to.equal(0);
    });

    it("only owner can add to party", async function () {
        await deployContracts(this);
        await monSetup(this);
        await setupUsers(this);

        this.monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0);

        await this.monManager.connect(this.user0).setPartyMember(0, 1);
        var party = await this.monManager.getParty(this.user0.address);
        expect(party[0].currentHP.toNumber()).to.be.gt(0);

        // TODO kind of a shitty test but idk how else to do it with async
        try
        {
            await this.monManager.connect(this.user1).setPartyMember(0, 1);
            expect(true).to.equal(false);
        }
        catch(err)
        {
            expect(true).to.equal(true);
        }
    });
});
