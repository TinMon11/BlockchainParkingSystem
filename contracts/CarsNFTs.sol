// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CarsNFTs is Ownable, ERC721 {
    struct Car {
        string carNumber;
        address owner;
        bool isParked;
        uint256 fineAmount;
        mapping(address => bool) allowedPeople;
        address[] allowedPeopleList;
    }

    uint256 public mintPrice;
    uint256 public addPeoplePrice;
    uint256 public removePeoplePrice;
    uint256 totalSupply = 0;
    // Mapping
    mapping(uint256 => Car) public cars;
    mapping(string => uint256) public carsTokenId;
    mapping(address => bool) public allowedParkinsSystems;

    modifier onlyParkingSystem() {
        require(
            allowedParkinsSystems[msg.sender],
            "Only Allowed Parking System can call this function"
        );
        _;
    }

    constructor(
        uint256 initialMintPrice,
        uint256 initialAddPeoplePrice,
        uint256 initialRemovePeoplePrice
    ) ERC721("CarsNFT", "CAR") {
        mintPrice = initialMintPrice;
        addPeoplePrice = initialAddPeoplePrice;
        removePeoplePrice = initialRemovePeoplePrice;
    }

    event CarMinted(uint256 tokenId, string carNumber, address owner);
    event CarTransferred(uint256 tokenId, address from, address to);
    event CarBurned(uint256 tokenId, address owner);
    event AddAllowPeopleToCar(uint256 tokenId, address person);
    event RemoveAllowPeopleToCar(uint256 tokenId, address person);
    event FinePayment(uint256 tokenId, uint256 amount, address parkingSystem);

    // Mint New Car
    function mintCar(string memory carNumber) public payable {
        require(msg.value >= mintPrice, "Insufficient amount to mint a car");
        totalSupply++;
        _safeMint(msg.sender, totalSupply);
        carsTokenId[carNumber] = totalSupply;
        Car storage car = cars[totalSupply];
        car.carNumber = carNumber;
        car.owner = msg.sender;
        car.isParked = false;
        car.fineAmount = 0;
        car.allowedPeople[msg.sender] = true;
        car.allowedPeopleList.push(msg.sender);
        emit CarMinted(totalSupply, carNumber, msg.sender);
    }

    // Transfer Car
    function transferCar(string calldata carNumber, address to) public payable {
        uint256 tokenId = carsTokenId[carNumber];
        Car storage car = cars[tokenId];
        require(car.owner == msg.sender, "You are not the owner of this car");
        require(
            car.isParked == false,
            "You cannot transfer a car that is parked"
        );
        require(car.fineAmount == 0, "You cannot transfer a car that is fined");
        _transfer(msg.sender, to, tokenId);
        car.owner = to;
        for (uint256 i = 0; i < car.allowedPeopleList.length; i++) {
            address allowedPerson = car.allowedPeopleList[i];
            car.allowedPeople[allowedPerson] = false;
        }
        car.allowedPeople[to] = true;
        car.allowedPeopleList = new address[](0);
        car.allowedPeopleList.push(to);
        emit CarTransferred(tokenId, msg.sender, to);
    }

    // Add Allowed People
    function addAllowedPeople(
        string calldata carNumber,
        address person
    ) public payable {
        require(
            msg.value >= addPeoplePrice,
            "Insufficient amount to add allowed people"
        );
        uint256 tokenId = carsTokenId[carNumber];
        Car storage car = cars[tokenId];
        require(car.owner == msg.sender, "You are not the owner of this car");
        require(person != car.owner, "You cannot add the owner");
        car.allowedPeople[person] = true;
        car.allowedPeopleList.push(person);
        emit AddAllowPeopleToCar(tokenId, person);
    }

    // Remove Allowed People
    function removeAllowedPeople(
        string calldata carNumber,
        address person
    ) public payable {
        require(
            msg.value >= removePeoplePrice,
            "Insufficient amount to remove allowed people"
        );
        uint256 tokenId = carsTokenId[carNumber];
        Car storage car = cars[tokenId];
        require(car.owner == msg.sender, "You are not the owner of this car");
        require(person != car.owner, "You cannot remove the owner");
        car.allowedPeople[person] = false;
        emit RemoveAllowPeopleToCar(tokenId, person);
    }

    function isAllowedToUseCar(
        string calldata carNumber,
        address person
    ) public view returns (bool) {
        uint256 tokenId = carsTokenId[carNumber];
        Car storage car = cars[tokenId];
        return car.allowedPeople[person];
    }

    function addFine(
        string calldata carNumber,
        uint256 fineAmount
    ) external onlyParkingSystem {
        uint256 tokenId = carsTokenId[carNumber];
        Car storage car = cars[tokenId];
        require(
            car.isParked == true,
            "You cannot fine a car that is not parked"
        );
        car.fineAmount = car.fineAmount + fineAmount;
    }

    function informFinePayment(
        string calldata carNumber,
        uint256 amount,
        address parkingSystem
    ) public onlyParkingSystem {
        uint256 tokenId = carsTokenId[carNumber];
        Car storage car = cars[tokenId];
        require(car.fineAmount > 0, "This car has no fine");
        car.fineAmount = car.fineAmount - amount;
        emit FinePayment(tokenId, amount, parkingSystem);
    }

    function togglePark(
        string calldata carNumber,
        address caller
    ) public payable onlyParkingSystem {
        uint256 tokenId = carsTokenId[carNumber];
        bool isAllowed = isAllowedToUseCar(carNumber, caller);
        require(isAllowed, "You are not allowed to use this car");
        Car storage car = cars[tokenId];
        car.isParked = !car.isParked;
    }

    function getCarInfo(
        string calldata carNumber
    ) public view returns (address, bool, uint256, uint256, address[] memory) {
        uint256 tokenId = carsTokenId[carNumber];
        require(tokenId != 0, "This car does not exist");
        Car storage car = cars[tokenId];
        return (
            car.owner,
            car.isParked,
            car.fineAmount,
            car.allowedPeopleList.length,
            car.allowedPeopleList
        );
    }

    function getCarId(string calldata carNumber) public view returns (uint256) {
        return carsTokenId[carNumber];
    }

    function addParkingSystem(address parkingSystem) public onlyOwner {
        allowedParkinsSystems[parkingSystem] = true;
    }

    function removeParkingSystem(address parkingSystem) public onlyOwner {
        allowedParkinsSystems[parkingSystem] = false;
    }

    function withdrawBenefits() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function setCosts(
        uint256 newMintPrice,
        uint256 newAddPeoplePrice,
        uint256 newRemovePeoplePrice
    ) public onlyOwner {
        mintPrice = newMintPrice;
        addPeoplePrice = newAddPeoplePrice;
        removePeoplePrice = newRemovePeoplePrice;
    }
}
