const { ethers, network } = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xb1f0b994eF138EB6949Cc36a609a8fc03D9614bD"; // Replace this with your contract address

  const mintPrice = ethers.utils.parseEther("0.01");
  const addPeoplePrice = ethers.utils.parseEther("0.001");
  const removePeoplePrice = ethers.utils.parseEther("0.001");
  const transferPrice = ethers.utils.parseEther("0.005");

  console.log("Verifying contract on network:", network.name);
  await hre.run("verify:verify", {
    address: CONTRACT_ADDRESS,
    constructorArguments: [
      mintPrice,
      addPeoplePrice,
      removePeoplePrice,
      transferPrice,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
