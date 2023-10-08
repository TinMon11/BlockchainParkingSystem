// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./CarsNFTs.sol";

/// @notice Contract to Manage the Parking System
/// @notice Uses CARSNFTs contract to manage the cars
/// @dev TinchoMon
contract StreetParking is Ownable {
    CarsNFTs public carsNFTsContract;

    uint256 public OneMinuteParkFee;
    uint256 public fineForLateUnparking;
    uint256 public totalCarBalances;
    mapping(string => uint256) public initialParkTime;
    mapping(string => uint256) public carBalance;
    mapping(string => uint256) public listOfCarFines;

    event Parked(string carNumber, uint256 parkedTime);
    event Unparked(string carNumber, uint256 parkedTime);

    constructor(uint256 parkPrice, uint256 finePrice, address _erc721) {
        carsNFTsContract = CarsNFTs(_erc721);
        OneMinuteParkFee = parkPrice;
        fineForLateUnparking = finePrice;
    }

    /// @notice sets the Park Fee
    /// @param newFee the new fee to be set
    function setParkFee(uint256 newFee) public onlyOwner {
        OneMinuteParkFee = newFee;
    }

    /// @notice sets the Fine for Late Unparking
    /// @param newFine the new fine to be set
    function setFine(uint256 newFine) public onlyOwner {
        fineForLateUnparking = newFine;
    }

    /// @notice adds balance to a car
    /// @param carNumber the car number to add balance tos
    function addBalanceToCar(string memory carNumber) public payable {
        carBalance[carNumber] += msg.value;
        totalCarBalances += msg.value;
    }

    /// @notice withdraws the balance of a car (only the owner can withdraw)
    /// @notice util if user doesn't want to use the car anymore
    /// @param carNumber the car number to withdraw balance from
    function withdrawCarBalance(string memory carNumber) public {
        (address carOwner, , , , ) = carsNFTsContract.getCarInfo(carNumber);
        require(carOwner == msg.sender, "You are not the owner of this car");
        require(carBalance[carNumber] > 0, "No balance to withdraw");
        payable(msg.sender).transfer(carBalance[carNumber]);
        totalCarBalances -= carBalance[carNumber];
        carBalance[carNumber] = 0;
    }

    /// @notice starts parking a car
    /// @notice only the owner or allowed people of the car can start parking
    /// @param carNumber the car number to start parking
    /// @param parkingMinutes the amount of minutes to park
    function startParking(
        string memory carNumber,
        uint256 parkingMinutes
    ) public {
        (, bool isCarParked, uint256 carFine, , ) = carsNFTsContract.getCarInfo(
            carNumber
        );
        require(carFine == 0, "Car is fined");
        require(isCarParked == false, "Car is already parked");
        bool isAllowed = carsNFTsContract.isAllowedToUseCar(
            carNumber,
            msg.sender
        );
        require(isAllowed == true, "You are not allowed to use this car");
        uint256 amountToPay = parkingMinutes * OneMinuteParkFee;
        require(
            carBalance[carNumber] >= amountToPay,
            "Insufficient amount to park that long"
        );
        carsNFTsContract.togglePark(carNumber, msg.sender);
        initialParkTime[carNumber] = block.timestamp;
        emit Parked(carNumber, block.timestamp);
    }

    /// @notice stops parking a car
    /// @notice only the owner or allowed people of the car can stop parking
    /// @param carNumber the car number to stop parking
    function stopParking(string memory carNumber) public {
        (, bool isCarParked, , , ) = carsNFTsContract.getCarInfo(carNumber);
        bool isAllowed = carsNFTsContract.isAllowedToUseCar(
            carNumber,
            msg.sender
        );
        require(isAllowed == true, "You are not allowed to unpark this car");
        require(isCarParked == true, "Car is not parked");
        uint256 totalParkedTime = (block.timestamp -
            initialParkTime[carNumber]) / 60;
        uint256 amountToPay = totalParkedTime * OneMinuteParkFee;
        if (amountToPay > carBalance[carNumber]) {
            carBalance[carNumber] = 0;
            totalCarBalances -= carBalance[carNumber];
            carsNFTsContract.addFine(carNumber, fineForLateUnparking);
            listOfCarFines[carNumber] += fineForLateUnparking;
        } else {
            carBalance[carNumber] -= amountToPay;
            totalCarBalances -= amountToPay;
        }
        carsNFTsContract.togglePark(carNumber, msg.sender);
    }

    /// @notice pays a fine for a car
    /// @param carNumber the car number to pay the fine
    function payCarFine(string memory carNumber) public payable {
        (, , uint256 carFine, , ) = carsNFTsContract.getCarInfo(carNumber);
        require(carFine > 0, "This car has no fines");
        require(msg.value >= carFine, "Insufficient amount to pay the fine");
        carsNFTsContract.informFinePayment(carNumber, msg.value, address(this));
        listOfCarFines[carNumber] -= msg.value;
    }

    /// @notice withdraws the benefits of the contract (only the Parking System owner can withdraw)
    function withdrawBenefits() public onlyOwner {
        uint256 withdrawableAmount = address(this).balance - totalCarBalances;
        require(
            withdrawableAmount > 0,
            "There is no balance to withdraw at this time"
        );
        payable(msg.sender).transfer(withdrawableAmount);
    }
}
