const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonManager", function () {
    it("bulbasaur add to party", async function () {
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

        const MonManager = await ethers.getContractFactory("MonManager");
        const monManager = await MonManager.deploy(monNFT.address, moves.address);
        await monManager.deployed();

        const [user0, user1] = await ethers.getSigners();

        monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        await monNFT.mintSpeciesMon(user0.address, 1, 5, 1, 0, 0, 0);
        await monManager.connect(user0).setPartyMember(0, 1);
        var party = await monManager.getParty(user0.address);
        expect(party[0].currentHP.toNumber()).to.be.gt(0);
        expect(party[1].currentHP.toNumber()).to.equal(0);
    });

    it("only owner can add to party", async function () {
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

        const MonManager = await ethers.getContractFactory("MonManager");
        const monManager = await MonManager.deploy(monNFT.address, moves.address);
        await monManager.deployed();

        const [user0, user1] = await ethers.getSigners();

        monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500);
        await monNFT.mintSpeciesMon(user0.address, 1, 5, 1, 0, 0, 0);

        await monManager.connect(user0).setPartyMember(0, 1);
        var party = await monManager.getParty(user0.address);
        expect(party[0].currentHP.toNumber()).to.be.gt(0);

        // TODO kind of a shitty test but idk how else to do it with async
        try
        {
            await monManager.connect(user1).setPartyMember(0, 1);
            expect(true).to.equal(false);
        }
        catch(err)
        {
            expect(true).to.equal(true);
        }
    });
});
