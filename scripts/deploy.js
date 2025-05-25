const hre = require("hardhat");

const mintPrice = ethers.utils.parseEther("0.01");
const addPeoplePrice = ethers.utils.parseEther("0.001");
const removePeoplePrice = ethers.utils.parseEther("0.001");
const transferPrice = ethers.utils.parseEther("0.005");
const parkFee = ethers.utils.parseEther("0.001");
const fineFee = ethers.utils.parseEther("0.02");

async function main() {
  // Setup accounts
  const [CarNFTsDeployer, ParkingSystemDeployer] =
    await hre.ethers.getSigners();

  // Deploy CarNFTs contract
  const CarNFTsFactory = await hre.ethers.getContractFactory(
    "CarsNFTs",
    CarNFTsDeployer
  );
  const carNFTsInstance = await CarNFTsFactory.deploy(
    mintPrice,
    addPeoplePrice,
    removePeoplePrice,
    transferPrice
  );
  await carNFTsInstance.deployed();
  console.log("CarNFTs deployed to:", carNFTsInstance.address);

  const ParkingSystemFactory = await hre.ethers.getContractFactory(
    "StreetParking",
    ParkingSystemDeployer
  );
  const parkingSystemInstance = await ParkingSystemFactory.deploy(
    parkFee,
    fineFee,
    carNFTsInstance.address
  );

  await parkingSystemInstance.deployed();
  console.log("ParkingSystem deployed to:", parkingSystemInstance.address);

  console.log("Owner Of Contracts:", await carNFTsInstance.owner());
  console.log("Owner Of Contracts:", await parkingSystemInstance.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// CarNFTs deployed to: 0xb1f0b994eF138EB6949Cc36a609a8fc03D9614bD
// ParkingSystem deployed to: 0x4fB4D99A8356F524B348EfD193293928E4A02479
// Owner Of Contracts: 0xc68f118ba14aff63B66d0f7D84c5c9861F5FB862
// Owner Of Contracts: 0xc68f118ba14aff63B66d0f7D84c5c9861F5FB862
