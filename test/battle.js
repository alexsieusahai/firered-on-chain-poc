const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployContracts, monSetup, setupUsers } = require("./common_setup.js");

describe("Battle", function () {
    it("bulbasaur vs wild pidgey", async function () {
        await setupUsers(this);
        await deployContracts(this);
        await monSetup(this);

        // give user0 bulbasaur
        await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0);
        await this.monManager.connect(this.user0).setPartyMember(this.user0.address, 0, 1);

        const tx = await this.monNFT.mintWildMon(this.user0.address, 0);
        await tx.wait();
        const expBefore = await this.monNFT.idToExp(1);
        const EVBefore = await this.monNFT.idToEV(1);
        await this.battle.startBattleWild(this.user0.address);
        await this.battle.ingestAction(this.user0.address, 1, 0); // my bulbasaur uses its move in slot 0
        await this.battle.ingestAction(this.user0.address, 1, 0);
        await this.battle.ingestAction(this.user0.address, 1, 0);
        expect((await this.monNFT.idToExp(1)).toNumber()).to.be.gt(expBefore.toNumber());
        expect((await this.monNFT.idToEV(1)).speed.toNumber()).to.be.gt(EVBefore.speed.toNumber());
        expect(await this.battle.inBattle(this.user0.address)).to.equal(false);
    });

    it("potion", async function () {
        await setupUsers(this);
        await deployContracts(this);
        await monSetup(this);

        // give user0 bulbasaur
        await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0);
        await this.monManager.connect(this.user0).setPartyMember(this.user0.address, 0, 1);

        // spawn a pidgey
        const tx = await this.monNFT.mintWildMon(this.user0.address, 0);
        await tx.wait();
        await this.battle.startBattleWild(this.user0.address);
        await this.battle.ingestAction(this.user0.address, 1, 0); // my bulbasaur uses its move in slot 0
        await this.battle.ingestAction(this.user0.address, 1, 0);
        await this.battle.ingestAction(this.user0.address, 1, 0);
        expect(await this.battle.inBattle(this.user0.address)).to.equal(false);
        const hpBefore = (await this.monNFT.idToHP(1)).toNumber();
        await this.item.giveItem(this.user0.address, 1, 1);
        await this.item.useItem(this.user0.address, 1, 1);
        const hpAfter = (await this.monNFT.idToHP(1)).toNumber();
        expect(hpBefore).to.be.lt(hpAfter);
    });


    it("swap mon example", async function () {
        await setupUsers(this);
        await deployContracts(this);
        await monSetup(this);

        var tx;
        tx = await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0);
        await tx.wait();
        tx = await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0);
        await tx.wait();
        tx = await this.monManager.setPartyMember(this.user0.address, 0, 1);
        await tx.wait();
        tx = await this.monManager.setPartyMember(this.user0.address, 1, 2);
        await tx.wait();

        // spawn pidgey and begin battling
        var tx;
        tx = await this.monNFT.mintWildMon(this.user0.address, 0);
        await tx.wait();

        var hp1 = await this.monNFT.idToHP(1);
        var hp2 = await this.monNFT.idToHP(2);

        tx = await this.battle.startBattleWild(this.user0.address);
        await tx.wait();
        tx = await this.battle.ingestAction(this.user0.address, 1, 0); // my bulbasaur uses its move in slot 0
        await tx.wait();
        tx = await this.battle.ingestAction(this.user0.address, 3, 1); // swap bulbasaur at slot 0 (currently fighting) with bulbasaur at slot 1
        await tx.wait();
        tx = await this.battle.ingestAction(this.user0.address, 1, 0);
        await tx.wait();
        tx = await this.battle.ingestAction(this.user0.address, 1, 0);
        await tx.wait();

        // both bulbasaur's should have taken damage
        expect(hp1).to.be.gt(await this.monNFT.idToHP(1));
        expect(hp2).to.be.gt(await this.monNFT.idToHP(2));
    });

    it("trainer battle example", async function () {
        await setupUsers(this);
        await deployContracts(this);
        await monSetup(this);

        var tx;
        tx = await this.monNFT.mintSpeciesMon(this.user0.address, 1, 5, 1, 0, 0, 0); // id 1
        await tx.wait();
        tx = await this.monManager.setPartyMember(this.user0.address, 0, 1);
        await tx.wait();
        tx = await this.monNFT.mintSpeciesMon(this.battle.address, 16, 3, 1, 0, 0, 0); // id 2
        await tx.wait();
        tx = await this.battle.startBattleAITrainer(this.user0.address, [2], 1000);
        await tx.wait();

        tx = await this.battle.ingestAction(this.user0.address, 1, 0);
        await tx.wait();
        tx = await this.battle.ingestAction(this.user0.address, 1, 0);
        await tx.wait();
        tx = await this.battle.ingestAction(this.user0.address, 1, 0);
        await tx.wait();
    });
});
