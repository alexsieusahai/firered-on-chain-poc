const { ethers } = require("hardhat");

async function callGreet() {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();
    console.log(await greeter.greet());
}

callGreet();
