// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./CarsNFTs.sol";

contract StreetParking is Ownable {
    CarsNFTs public carsNFTsContract;

    uint256 public HalfHourParkFee;
    uint256 public fineForLateUnparking;
    uint256 public totalCarBalances;
    mapping(string => uint256) public initialParkTime;
    mapping(string => uint256) public carBalance;
    mapping(string => uint256) public listOfCarFines;

    event Parked(string carNumber, uint256 parkedTime);
    event Unparked(string carNumber, uint256 parkedTime);

    constructor(uint256 parkPrice, uint256 finePrice, address _erc721) {
        carsNFTsContract = CarsNFTs(_erc721);
        HalfHourParkFee = parkPrice;
        fineForLateUnparking = finePrice;
    }

    function setParkFee(uint256 newFee) public onlyOwner {
        HalfHourParkFee = newFee;
    }

    function setFine(uint256 newFine) public onlyOwner {
        fineForLateUnparking = newFine;
    }

    function addBalanceToCar(string memory carNumber) public payable {
        carBalance[carNumber] += msg.value;
        totalCarBalances += msg.value;
    }

    function withdrawCarBalance(string memory carNumber) public {
        (address carOwner, , , , ) = carsNFTsContract.getCarInfo(carNumber);
        require(carOwner == msg.sender, "You are not the owner of this car");
        require(carBalance[carNumber] > 0, "No balance to withdraw");
        payable(msg.sender).transfer(carBalance[carNumber]);
        totalCarBalances -= carBalance[carNumber];
        carBalance[carNumber] = 0;
    }

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
        uint256 amountToPay = (parkingMinutes * HalfHourParkFee) / 30;
        require(
            carBalance[carNumber] >= amountToPay,
            "Insufficient amount to park that long"
        );
        carsNFTsContract.togglePark(carNumber, msg.sender);
        initialParkTime[carNumber] = block.timestamp;
        emit Parked(carNumber, block.timestamp);
    }

    function stopParking(string memory carNumber) public {
        (, bool isCarParked, , , ) = carsNFTsContract.getCarInfo(carNumber);
        bool isAllowed = carsNFTsContract.isAllowedToUseCar(
            carNumber,
            msg.sender
        );
        require(isAllowed == true, "You are not allowed to unpark this car");
        require(isCarParked == true, "Car is not parked");
        uint256 totalParkedTime = block.timestamp - initialParkTime[carNumber];
        uint256 amountToPay = (totalParkedTime * HalfHourParkFee) / 30;
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

    function payCarFine(string memory carNumber) public payable {
        (, , uint256 carFine, , ) = carsNFTsContract.getCarInfo(carNumber);
        require(carFine > 0, "This car has no fines");
        require(msg.value >= carFine, "Insufficient amount to pay the fine");
        carsNFTsContract.informFinePayment(carNumber, msg.value, address(this));
        listOfCarFines[carNumber] -= msg.value;
    }

    function withdrawBenefits() public onlyOwner {
        uint256 withdrawableAmount = address(this).balance - totalCarBalances;
        require(
            withdrawableAmount > 0,
            "There is no balance to withdraw at this time"
        );
        payable(msg.sender).transfer(withdrawableAmount);
    }
}
