const { expect } = require("chai");
const hre = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

let carsNFTsInstance;
let parkingInstance;

let carsNFTsAddress;
let parkingSystemAddress;

const sigInstances = {};
const sigAddrs = {};
const signerRoles = [
  "carsNFTOwner",
  "parkingSystemOwner",
  "car1Owner",
  "car1AllowedPerson",
  "car2Owner",
  "car2AllowedPerson",
  "car1AllowedPerson2",
];

const mintPrice = hre.ethers.utils.parseEther("0.1");
const addPeoplePrice = hre.ethers.utils.parseEther("0.05");
const removePeoplePrice = hre.ethers.utils.parseEther("0.05");
const transferPrice = hre.ethers.utils.parseEther("0.05");

const updateMintPrice = hre.ethers.utils.parseEther("0.05");
const updateAddPeoplePrice = hre.ethers.utils.parseEther("0.025");
const updateRemovePeoplePrice = hre.ethers.utils.parseEther("0.025");
const updateTransferPrice = hre.ethers.utils.parseEther("0.025");

const parkFee = hre.ethers.utils.parseEther("0.001");
const fineFee = hre.ethers.utils.parseEther("0.5");

const updateParkFee = hre.ethers.utils.parseEther("0.0005");
const updateFineFee = hre.ethers.utils.parseEther("0.25");

describe("Blockchain Parking System", function () {
  describe("Initialization & Deploys", () => {
    it("Should initialize signers", async function () {
      const testSigners = await hre.ethers.getSigners();
      for (let i = 0; i < signerRoles.length; i++) {
        const signerRole = signerRoles[i];
        sigInstances[signerRole] = testSigners[i];
        sigAddrs[signerRole] = await sigInstances[signerRole].getAddress();
      }
    });

    it("Should Deploy CarsNFTs", async function () {
      const carsNFTFactory = await hre.ethers.getContractFactory(
        "CarsNFTs",
        sigInstances.carsNFTOwner
      );

      carsNFTsInstance = await carsNFTFactory.deploy(
        mintPrice,
        addPeoplePrice,
        removePeoplePrice,
        transferPrice
      );
      await carsNFTsInstance.deployed();

      carsNFTsAddress = carsNFTsInstance.address;

      const carsNFTsOwner = await carsNFTsInstance.owner();
      expect(carsNFTsOwner).to.equal(sigAddrs.carsNFTOwner);
    });

    it("Should Deploy Parking Contract", async function () {
      const parkingFactory = await hre.ethers.getContractFactory(
        "StreetParking",
        sigInstances.parkingSystemOwner
      );

      parkingInstance = await parkingFactory.deploy(
        parkFee,
        fineFee,
        carsNFTsAddress
      );
      await parkingInstance.deployed();

      parkingSystemAddress = parkingInstance.address;

      const parkingSystemOwner = await parkingInstance.owner();
      expect(parkingSystemOwner).to.equal(sigAddrs.parkingSystemOwner);
    });

    describe("CarNFTs Testing", () => {
      it("Should Mint a Car", async function () {
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        const carNumber = "AAA-123";
        const mintTx = await minterInstance.mintCar(carNumber, {
          value: mintPrice,
        });
        await mintTx.wait();

        const carOwner = await carsNFTsInstance.ownerOf(1);
        expect(carOwner).to.equal(sigAddrs.car1Owner);

        const carId = await carsNFTsInstance.carsTokenId(carNumber);
        expect(carId).to.equal(1);
      });

      it("Should NOT allow to mint a car if not enough value", async function () {
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car2Owner
        );
        const carNumber = "BBB-123";
        await expect(
          minterInstance.mintCar(carNumber, { value: mintPrice.div(2) })
        ).to.be.revertedWith("Insufficient amount to mint a car");
      });

      it("Should Add Allowed Person", async function () {
        const carNumber = "AAA-123";
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        const allowedPerson = sigAddrs.car1AllowedPerson;
        const addAllowedPersonTx = await minterInstance.addAllowedPeople(
          carNumber,
          allowedPerson,
          { value: addPeoplePrice }
        );
        await addAllowedPersonTx.wait();

        const isAllowedPerson = await carsNFTsInstance.isAllowedToUseCar(
          carNumber,
          allowedPerson
        );
        expect(isAllowedPerson).to.equal(true);
      });

      it("Shoult NOT Allow to Add Allowed Person if not enough value", async function () {
        const carNumber = "AAA-123";
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        const allowedPerson = sigAddrs.car1AllowedPerson;
        await expect(
          minterInstance.addAllowedPeople(carNumber, allowedPerson, {
            value: addPeoplePrice.div(2),
          })
        ).to.be.revertedWith("Insufficient amount to add allowed people");
      });

      it("Should NOT Allow to Add Allowed Person if not owner", async function () {
        const carNumber = "AAA-123";
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car2Owner
        );
        const allowedPerson = sigAddrs.car2AllowedPerson;
        await expect(
          minterInstance.addAllowedPeople(carNumber, allowedPerson, {
            value: addPeoplePrice,
          })
        ).to.be.revertedWith("You are not the owner of this car");
      });

      it("Should NOT Allow to Remove Allowed Person if not enough value", async function () {
        const carNumber = "AAA-123";
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        const allowedPerson = sigAddrs.car1AllowedPerson;
        await expect(
          minterInstance.removeAllowedPeople(carNumber, allowedPerson, {
            value: addPeoplePrice.div(2),
          })
        ).to.be.revertedWith("Insufficient amount to remove allowed people");
      });

      it("Should NOT Allow to Remove Allowed Person if not owner", async function () {
        const carNumber = "AAA-123";
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car2Owner
        );
        const allowedPerson = sigAddrs.car2AllowedPerson;
        await expect(
          minterInstance.removeAllowedPeople(carNumber, allowedPerson, {
            value: removePeoplePrice,
          })
        ).to.be.revertedWith("You are not the owner of this car");
      });

      it("Should remove Allowed Person", async function () {
        const carNumber = "AAA-123";
        const minterInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        const allowedPerson = sigAddrs.car1AllowedPerson;
        const removeAllowedPersonTx = await minterInstance.removeAllowedPeople(
          carNumber,
          allowedPerson,
          { value: removePeoplePrice }
        );
        await removeAllowedPersonTx.wait();

        const isAllowedPerson = await carsNFTsInstance.isAllowedToUseCar(
          carNumber,
          allowedPerson
        );
        expect(isAllowedPerson).to.equal(false);
      });

      it("Should return Car Info", async function () {
        const carNumber = "AAA-123";
        const carInfo = await carsNFTsInstance.getCarInfo(carNumber);
        expect(carInfo[0]).to.equal(sigAddrs.car1Owner);
        expect(carInfo[1]).to.equal(false);
        expect(carInfo[2]).to.equal(0);
        expect(carInfo[3]).to.equal(2); // Owner + Allowed Person
        expect(carInfo[4][0]).to.equal(sigAddrs.car1Owner);
        expect(carInfo[4][1]).to.equal(sigAddrs.car1AllowedPerson);
      });

      it("Should allow owner to modify costs", async function () {
        const ownerInstance = await carsNFTsInstance.connect(
          sigInstances.carsNFTOwner
        );
        const modifyCostsTx = await ownerInstance.setCosts(
          updateMintPrice,
          updateAddPeoplePrice,
          updateRemovePeoplePrice,
          updateTransferPrice
        );
        await modifyCostsTx.wait();

        const mintPrice = await carsNFTsInstance.mintPrice();
        const addPeoplePrice = await carsNFTsInstance.addPeoplePrice();
        const removePeoplePrice = await carsNFTsInstance.removePeoplePrice();
        const transferPrice = await carsNFTsInstance.transferPrice();
        expect(addPeoplePrice).to.equal(updateAddPeoplePrice);
        expect(removePeoplePrice).to.equal(updateRemovePeoplePrice);
        expect(mintPrice).to.equal(updateMintPrice);
        expect(transferPrice).to.equal(updateTransferPrice);
      });

      it("Should NOT allow non-owner to modify costs", async function () {
        const carOnwerInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        await expect(
          carOnwerInstance.setCosts(
            mintPrice,
            addPeoplePrice,
            removePeoplePrice,
            transferPrice
          )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should allow owner to transfer car", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        const transferTx = await carOnwerInstance.transferCar(
          carNumber,
          sigAddrs.car2Owner,
          { value: updateTransferPrice }
        );
        await transferTx.wait();

        const carId = await carsNFTsInstance.carsTokenId(carNumber);

        const carOwner = await carsNFTsInstance.ownerOf(carId);
        const carInfo = await carsNFTsInstance.getCarInfo(carNumber);

        expect(carOwner).to.equal(sigAddrs.car2Owner);
        expect(carInfo[0]).to.equal(sigAddrs.car2Owner);
        expect(carInfo[1]).to.equal(false); // Not Parked
        expect(carInfo[2]).to.equal(0); // Not fines
        expect(carInfo[3]).to.equal(1); // Only the Owner
        expect(carInfo[4][0]).to.equal(sigAddrs.car2Owner); // Owner
        expect(carInfo[4][1]).to.be.undefined; // No Allowed Person
      });

      it("Should allow new owner to add allowed person", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await carsNFTsInstance.connect(
          sigInstances.car2Owner
        );
        const allowedPerson = sigAddrs.car1AllowedPerson2;
        const addAllowedPersonTx = await carOnwerInstance.addAllowedPeople(
          carNumber,
          allowedPerson,
          { value: addPeoplePrice }
        );
        await addAllowedPersonTx.wait();

        const isAllowedPerson = await carsNFTsInstance.isAllowedToUseCar(
          carNumber,
          allowedPerson
        );
        expect(isAllowedPerson).to.equal(true);
      });

      it("Should NOT allow non-owner to transfer car", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        await expect(
          carOnwerInstance.transferCar(carNumber, sigAddrs.car2Owner, {
            value: updateTransferPrice,
          })
        ).to.be.revertedWith("You are not the owner of this car");
      });
    });
    describe("Parking System General Testing", () => {
      it("Should allow owner to set parking and fine prices", async function () {
        const ownerInstance = await parkingInstance.connect(
          sigInstances.parkingSystemOwner
        );

        const setParkingPriceTx = await ownerInstance.setParkFee(updateParkFee);
        await setParkingPriceTx.wait();
        const setFinePriceTx = await ownerInstance.setFine(updateFineFee);
        await setFinePriceTx.wait();

        const parkFee = await parkingInstance.OneMinuteParkFee();
        const fine = await parkingInstance.fineForLateUnparking();

        expect(parkFee).to.equal(updateParkFee);
        expect(fine).to.equal(updateFineFee);
      });

      it("Should NOT allow non-owner to set parking and fine prices", async function () {
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car1Owner
        );
        await expect(carOnwerInstance.setParkFee(parkFee)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
        await expect(carOnwerInstance.setFine(fineFee)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("Should Add Balance to Car in Parking System", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );

        const carBalanceBefore = await parkingInstance.carBalance(carNumber);
        const totalCarBalancesBefore = await parkingInstance.totalCarBalances();
        const parkingBeforeBalance = await hre.ethers.provider.getBalance(
          parkingSystemAddress
        );

        const amountToAdd = hre.ethers.utils.parseEther("0.005");
        const addBalanceTx = await carOnwerInstance.addBalanceToCar(carNumber, {
          value: amountToAdd,
        });
        await addBalanceTx.wait();

        const carBalanceAfter = await parkingInstance.carBalance(carNumber);
        const totalCarBalancesAfter = await parkingInstance.totalCarBalances();
        const parkingAfterBalance = await hre.ethers.provider.getBalance(
          parkingSystemAddress
        );

        expect(parkingAfterBalance).to.equal(
          parkingBeforeBalance.add(amountToAdd)
        );
        expect(carBalanceAfter).to.equal(carBalanceBefore.add(amountToAdd));
        expect(totalCarBalancesAfter).to.equal(
          totalCarBalancesBefore.add(amountToAdd)
        );
      });

      it("Should NOT allow non-car-owner to withdraw balance", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car1Owner
        );
        await expect(
          carOnwerInstance.withdrawCarBalance(carNumber)
        ).to.be.revertedWith("You are not the owner of this car");
      });

      it("Should Allow Car Owner to Withdraw Balance", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );

        const carBalanceBefore = await parkingInstance.carBalance(carNumber);
        const totalCarBalancesBefore = await parkingInstance.totalCarBalances();
        const parkingBeforeBalance = await hre.ethers.provider.getBalance(
          parkingSystemAddress
        );
        const carOwnerBeforeBalance = await hre.ethers.provider.getBalance(
          sigAddrs.car2Owner
        );

        const withdrawBalanceTx = await carOnwerInstance.withdrawCarBalance(
          carNumber
        );
        await withdrawBalanceTx.wait();

        const carBalanceAfter = await parkingInstance.carBalance(carNumber);
        const totalCarBalancesAfter = await parkingInstance.totalCarBalances();
        const parkingAfterBalance = await hre.ethers.provider.getBalance(
          parkingSystemAddress
        );
        const carOwnerAfterBalance = await hre.ethers.provider.getBalance(
          sigAddrs.car2Owner
        );

        expect(parkingAfterBalance).to.equal(
          parkingBeforeBalance.sub(carBalanceBefore)
        );
        expect(carBalanceAfter).to.equal(0);
        expect(carOwnerAfterBalance).to.be.gt(carOwnerBeforeBalance);
        expect(totalCarBalancesAfter).to.equal(
          totalCarBalancesBefore.sub(carBalanceBefore)
        );
      });

      it("Should Not Allow to Park a Car if Parking System is not yet allowed on CarNFTs Contract", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );
        const addBalanceTx = await carOnwerInstance.addBalanceToCar(carNumber, {
          value: updateParkFee.mul(10), // 10 minutes of parking balance
        });
        await addBalanceTx.wait();

        await expect(
          carOnwerInstance.startParking(carNumber, 5) // 5 minutes of parking
        ).to.be.revertedWith(
          "Only Allowed Parking System can call this function"
        );
      });

      it("Should NOT allow a non-owner to add Parking System on CarNFTsContract", async function () {
        const carNFTsOwnerInstance = await carsNFTsInstance.connect(
          sigInstances.car1Owner
        );
        await expect(
          carNFTsOwnerInstance.addParkingSystem(parkingSystemAddress)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should add Parking System to Allowed Contracts on CarNFTs Contract", async function () {
        const carsNFTOwnerInstance = await carsNFTsInstance.connect(
          sigInstances.carsNFTOwner
        );
        const addParkingSystemTx = await carsNFTOwnerInstance.addParkingSystem(
          parkingSystemAddress
        );
        await addParkingSystemTx.wait();

        const isAllowedParkingSystem =
          await carsNFTsInstance.allowedParkinsSystems(parkingSystemAddress);
        expect(isAllowedParkingSystem).to.equal(true);
      });
    }),
      describe("Parking/Unparking Testing", () => {
        it("Should NOT allow non-car-owner to park car", async function () {
          const carNumber = "AAA-123";
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car1Owner
          );

          await expect(
            carOnwerInstance.startParking(carNumber, 10)
          ).to.be.revertedWith("You are not allowed to use this car");
        });

        it("Should NOT allow to park car if not enough balance", async function () {
          const carNumber = "AAA-123";
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car2Owner
          );

          await expect(
            carOnwerInstance.startParking(carNumber, 120)
          ).to.be.revertedWith("Insufficient amount to park that long");
        });

        it("Should NOT allow to unpark car if not parked", async function () {
          const carNumber = "AAA-123";
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car2Owner
          );
          await expect(
            carOnwerInstance.stopParking(carNumber)
          ).to.be.revertedWith("Car is not parked");
        });

        it("Should Allow to Park a Car", async function () {
          const carNumber = "AAA-123";
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car2Owner
          );

          const parkCarTx = await carOnwerInstance.startParking(carNumber, 5);
          await parkCarTx.wait();

          const carInfo = await carsNFTsInstance.getCarInfo(carNumber);
          const initialParkTime = await parkingInstance.initialParkTime(
            carNumber
          );

          // timestamp of tx
          const txBlock = await hre.ethers.provider.getBlock(
            parkCarTx.blockNumber
          );

          expect(initialParkTime).to.equal(txBlock.timestamp);
          expect(carInfo[1]).to.equal(true); // Parked
          expect(carInfo[2]).to.equal(0); // No fines
        });

        it("Should NOT allow to park car if already parked", async function () {
          const carNumber = "AAA-123";
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car2Owner
          );
          await expect(
            carOnwerInstance.startParking(carNumber, 30)
          ).to.be.revertedWith("Car is already parked");
        });

        it("Should NOT allow non-authorised person to unpark car", async function () {
          const carNumber = "AAA-123";
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car1AllowedPerson
          );
          await expect(
            carOnwerInstance.stopParking(carNumber)
          ).to.be.revertedWith("You are not allowed to unpark this car");
        });

        it("Should unpark car", async function () {
          const carNumber = "AAA-123";
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car2Owner
          );

          const parkingSystemBalanceBefore =
            await hre.ethers.provider.getBalance(parkingSystemAddress);
          const carBalanceBefore = await parkingInstance.carBalance(carNumber);

          const totalCarsBalanceBefore =
            await parkingInstance.totalCarBalances();

          await helpers.time.increase(120);

          const unparkCarTx = await carOnwerInstance.stopParking(carNumber);
          await unparkCarTx.wait();

          const parkingSystemBalanceAfter =
            await hre.ethers.provider.getBalance(parkingSystemAddress);
          const carBalanceAfter = await parkingInstance.carBalance(carNumber);
          const totalCarsBalanceAfter =
            await parkingInstance.totalCarBalances();

          const carInfo = await carsNFTsInstance.getCarInfo(carNumber);
          const initialParkTime = await parkingInstance.initialParkTime(
            carNumber
          );
          const txBlock = await hre.ethers.provider.getBlock(
            unparkCarTx.blockNumber
          );
          const finalParkTime = hre.ethers.BigNumber.from(txBlock.timestamp);
          const parkingFee = await parkingInstance.OneMinuteParkFee();

          const amountToPay = finalParkTime
            .sub(initialParkTime)
            .div(60)
            .mul(parkingFee);

          expect(parkingSystemBalanceAfter).to.equal(
            parkingSystemBalanceBefore
          );

          expect(carBalanceAfter).to.equal(carBalanceBefore.sub(amountToPay));
          expect(totalCarsBalanceAfter).to.equal(
            totalCarsBalanceBefore.sub(amountToPay)
          );
          expect(finalParkTime).to.be.gt(initialParkTime);
          expect(carInfo[1]).to.equal(false); // Not Parked
        });

        it("Should allow non-owner but allowed person to park car", async function () {
          const carNumber = "AAA-123";
          const carAllowedPersonInstance = await parkingInstance.connect(
            sigInstances.car1AllowedPerson2
          );
          const parkCarTx = await carAllowedPersonInstance.startParking(
            carNumber,
            5
          );
          await parkCarTx.wait();
          const carInfo = await carsNFTsInstance.getCarInfo(carNumber);
          expect(carInfo[1]).to.equal(true); // Parked
        });

        it("Should allow non-owner but allowed person to unpark car", async function () {
          const carNumber = "AAA-123";
          const carAllowedPersonInstance = await parkingInstance.connect(
            sigInstances.car1AllowedPerson2
          );
          const unparkCarTx = await carAllowedPersonInstance.stopParking(
            carNumber
          );
          await unparkCarTx.wait();
          const carInfo = await carsNFTsInstance.getCarInfo(carNumber);
          expect(carInfo[1]).to.equal(false); // Not Parked
        });

        it("Should NOT allow non-owner to withdraw balances of Parking System", async function () {
          const carOnwerInstance = await parkingInstance.connect(
            sigInstances.car1Owner
          );
          await expect(carOnwerInstance.withdrawBenefits()).to.be.revertedWith(
            "Ownable: caller is not the owner"
          );
        });

        it("Should Allow Owner to Withdraw Balances of Parking System", async function () {
          const ownerInstance = await parkingInstance.connect(
            sigInstances.parkingSystemOwner
          );

          const contractBalanceBefore = await hre.ethers.provider.getBalance(
            parkingSystemAddress
          );
          const totalCarsBalances = await parkingInstance.totalCarBalances();
          const withdrawableBenefits =
            contractBalanceBefore.sub(totalCarsBalances);

          const ownerBalanceBefore = await hre.ethers.provider.getBalance(
            sigAddrs.parkingSystemOwner
          );

          const withdrawTx = await ownerInstance.withdrawBenefits();
          await withdrawTx.wait();

          const ownerBalanceAfter = await hre.ethers.provider.getBalance(
            sigAddrs.parkingSystemOwner
          );
          const contractBalanceAfter = await hre.ethers.provider.getBalance(
            parkingSystemAddress
          );

          expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
          expect(contractBalanceAfter).to.equal(totalCarsBalances);
          expect(contractBalanceAfter).to.equal(
            contractBalanceBefore.sub(withdrawableBenefits)
          );
        });
        it("Should not allow to withdraw if no withdrawable benefits", async function () {
          const ownerInstance = await parkingInstance.connect(
            sigInstances.parkingSystemOwner
          );
          await expect(ownerInstance.withdrawBenefits()).to.be.revertedWith(
            "There is no balance to withdraw at this time"
          );
        });
      });

    describe("Parking System Fines Testing", () => {
      it("Should NOT add fine if unparking on time", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );

        const addBalanceTx = await carOnwerInstance.addBalanceToCar(carNumber, {
          value: updateParkFee.mul(30), // 30 minutes of parking balance
        });
        await addBalanceTx.wait();

        const parkCarTx = await carOnwerInstance.startParking(carNumber, 5);
        await parkCarTx.wait();

        await helpers.time.increase(10);

        const unparkCarTx = await carOnwerInstance.stopParking(carNumber);
        await unparkCarTx.wait();

        const carInfo = await carsNFTsInstance.getCarInfo(carNumber);
        expect(carInfo[2]).to.equal(0); // No fines
      });

      it("Should not allow to pay fine if no fine", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );
        await expect(
          carOnwerInstance.payCarFine(carNumber, { value: fineFee })
        ).to.be.revertedWith("This car has no fines");
      });

      it("Should add fine if unparking late", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );

        const parkCarTx = await carOnwerInstance.startParking(carNumber, 30);
        await parkCarTx.wait();

        const carBalance = await parkingInstance.carBalance(carNumber);
        await helpers.time.increase(3600); // 1 hour

        const unparkCarTx = await carOnwerInstance.stopParking(carNumber);
        await unparkCarTx.wait();

        const carFines = await parkingInstance.listOfCarFines(carNumber);
        const fineFee = await parkingInstance.fineForLateUnparking();

        const carInfo = await carsNFTsInstance.getCarInfo(carNumber);
        expect(carInfo[2]).to.equal(fineFee);
        expect(carFines).to.equal(fineFee);
      });

      it("Should NOT allow to pay fine if not enough value sent", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );

        const fineAmountOnSystem = await parkingInstance.fineForLateUnparking();

        await expect(
          carOnwerInstance.payCarFine(carNumber, {
            value: fineAmountOnSystem.div(2),
          })
        ).to.be.revertedWith("Insufficient amount to pay the fine");
      });

      it("Should Pay Fine and Unpark Car", async function () {
        const carNumber = "AAA-123";
        const carOnwerInstance = await parkingInstance.connect(
          sigInstances.car2Owner
        );
        const fineAmountOnSystem = await parkingInstance.fineForLateUnparking();
        const carFinesBefore = await parkingInstance.listOfCarFines(carNumber);

        const contractBalanceBefore = await hre.ethers.provider.getBalance(
          parkingSystemAddress
        );
        const carOnwerBalanceBefore = await hre.ethers.provider.getBalance(
          sigAddrs.car2Owner
        );

        const payFineTx = await carOnwerInstance.payCarFine(carNumber, {
          value: fineAmountOnSystem,
        });
        await payFineTx.wait();

        const contractBalanceAfter = await hre.ethers.provider.getBalance(
          parkingSystemAddress
        );
        const carOnwerBalanceAfter = await hre.ethers.provider.getBalance(
          sigAddrs.car2Owner
        );
        const carFinesAfter = await parkingInstance.listOfCarFines(carNumber);
        const carInfo = await carsNFTsInstance.getCarInfo(carNumber);

        expect(carInfo[2]).to.equal(0); // No fines
        expect(carFinesBefore).to.equal(fineAmountOnSystem);
        expect(carFinesAfter).to.equal(0);
        expect(carOnwerBalanceAfter).to.be.lt(carOnwerBalanceBefore);
        expect(contractBalanceAfter).to.equal(
          contractBalanceBefore.add(fineAmountOnSystem)
        );
      });
    });
  });
});
