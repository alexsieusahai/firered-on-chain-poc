const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Battle", function () {
    it("bulbasaur vs wild pidgey", async function () {
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

        const MonTypes = await ethers.getContractFactory("MonTypes");
        const monTypes = await MonTypes.deploy(moves.address);
        await monTypes.deployed();
        await monTypes.addSpecies(1, [3]);
        await monTypes.addSpecies(16, [0, 9]);

        const Battle = await ethers.getContractFactory("Battle");
        const battle = await Battle.deploy(monNFT.address, monManager.address, moves.address, monTypes.address);
        await battle.deployed();
        await monNFT.setBattleAddress(battle.address);
        await monManager.setBattleAddress(battle.address);


        const [user0, user1] = await ethers.getSigners();

        monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500); // bulbasaur
        monBaseStats.setStats(16, 4000, 4500, 4000, 3500, 3500, 5600); // pidgey
        moves.addInfo("Tackle", 0, true, 40, 100, 35, true);
        await monNFT.mintSpeciesMon(user0.address, 1, 5, 1, 0, 0, 0);
        await monManager.connect(user0).setPartyMember(0, 1);

        // spawn pidgey and begin battling
        const tx = await monNFT.mintWildMon(user0.address, 0);
        await tx.wait();

        const expBefore = await monNFT.idToExp(1);
        const EVBefore = await monNFT.idToEV(1);
        await battle.connect(user0).startBattleWild();
        await battle.connect(user0).ingestAction(1, 0); // my bulbasaur uses its move in slot 0
        await battle.connect(user0).ingestAction(1, 0);
        await battle.connect(user0).ingestAction(1, 0);
        expect((await monNFT.idToExp(1)).toNumber()).to.be.gt(expBefore.toNumber());
        expect((await monNFT.idToEV(1)).speed.toNumber()).to.be.gt(EVBefore.speed.toNumber());
    });

    it("swap mon example", async function () {
        const [user0] = await ethers.getSigners();

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
        var monManager = await MonManager.deploy(monNFT.address, moves.address);
        await monManager.deployed();
        monManager = monManager.connect(user0);

        const MonTypes = await ethers.getContractFactory("MonTypes");
        const monTypes = await MonTypes.deploy(moves.address);
        await monTypes.deployed();
        await monTypes.addSpecies(1, [3]);
        await monTypes.addSpecies(16, [0, 9]);

        const Battle = await ethers.getContractFactory("Battle");
        const battle = await Battle.deploy(monNFT.address, monManager.address, moves.address, monTypes.address);
        await battle.deployed();
        await monNFT.setBattleAddress(battle.address);
        await monManager.setBattleAddress(battle.address);


        monBaseStats.setStats(1, 4500, 4900, 4900, 6500, 6500, 4500); // bulbasaur
        monBaseStats.setStats(16, 4000, 4500, 4000, 3500, 3500, 5600); // pidgey
        moves.addInfo("Tackle", 0, true, 40, 100, 35, true);
        await monNFT.mintSpeciesMon(user0.address, 1, 5, 1, 0, 0, 0);
        await monNFT.mintSpeciesMon(user0.address, 1, 5, 1, 0, 0, 0);
        await monManager.setPartyMember(0, 1);
        await monManager.setPartyMember(1, 2);

        // spawn pidgey and begin battling
        var tx;
        tx = await monNFT.mintWildMon(user0.address, 0);
        await tx.wait();

        var hp1 = await monNFT.idToHP(1);
        var hp2 = await monNFT.idToHP(2);

        tx = await battle.connect(user0).startBattleWild();
        tx = await battle.connect(user0).ingestAction(1, 0); // my bulbasaur uses its move in slot 0
        tx = await battle.connect(user0).ingestAction(3, 1); // swap bulbasaur at slot 0 (currently fighting) with bulbasaur at slot 1
        tx = await battle.connect(user0).ingestAction(1, 0);
        tx = await battle.connect(user0).ingestAction(1, 0);

        // both bulbasaur's should have taken damage
        expect(hp1).to.be.gt(await monNFT.idToHP(1));
        expect(hp2).to.be.gt(await monNFT.idToHP(2));
    });
});
