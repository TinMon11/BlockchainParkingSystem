# Blockchain Parking System 🚗

A decentralized parking management system built on EVM blockchain that allows users to manage their cars as NFTs and handle parking operations securely.

## Overview

This project implements a complete blockchain-based parking system with two main smart contracts:

1. **CarsNFTs.sol**: Manages cars as NFTs with features like:

   - Minting new car NFTs
   - Transferring car ownership
   - Managing allowed drivers
   - Tracking parking status and fines
   - ERC721 compliant

2. **StreetParking.sol**: Handles parking operations:
   - Start/stop parking sessions
   - Manage parking fees
   - Handle fines for late unparking
   - Process payments and withdrawals

## Features

- 🚗 Car management as NFTs
- 🔐 Secure ownership and access control
- 💰 Automated fee calculation
- ⏱️ Time-based parking management
- 💸 Fine system for late unparking
- 👥 Multiple driver support per car
- 💱 ETH-based payments

## Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask or similar Web3 wallet
- Hardhat

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/blockchainParking.git
cd blockchainParking
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with:

```
PRIVATE_KEY=your_wallet_private_key(to deploy contract)
POLYGON_RPC=your_rpc
POLY_API_KEY=your_etherscan_api_key
```

## Usage

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test --network hardhat
```

### Deploy to Local Network

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Testnet/Mainnet

```bash
npx hardhat run scripts/deploy.js --network goerli
```

## Contract Interaction

### CarsNFTs Contract

- Mint a new car: `mintCar(carNumber)`
- Transfer car: `transferCar(carNumber, to)`
- Add allowed driver: `addAllowedPeople(carNumber, person)`
- Remove allowed driver: `removeAllowedPeople(carNumber, person)`

### StreetParking Contract

- Start parking: `startParking(carNumber, parkingMinutes)`
- Stop parking: `stopParking(carNumber)`
- Add balance: `addBalanceToCar(carNumber)`
- Pay fine: `payCarFine(carNumber)`

## Testing

The project includes comprehensive tests in the `test` directory:

- `CarsNFTs.js`: Tests for car NFT functionality
- Additional tests for parking system operations

## Security

- OpenZeppelin contracts for standard implementations
- Access control using Ownable pattern
- Secure payment handling
- Fine management system

## License

This project is licensed under the MIT License.

---

# Sistema de Estacionamiento Blockchain 🚗

Un sistema descentralizado de gestión de estacionamiento construido en la blockchain de Ethereum que permite a los usuarios gestionar sus autos como NFTs y manejar operaciones de estacionamiento de forma segura.

## Descripción General

Este proyecto implementa un sistema completo de estacionamiento basado en blockchain con dos contratos inteligentes principales:

1. **CarsNFTs.sol**: Gestiona los autos como NFTs con características como:

   - Acuñación de nuevos NFTs de autos
   - Transferencia de propiedad
   - Gestión de conductores autorizados
   - Seguimiento de estado de estacionamiento y multas
   - Compatible con ERC721

2. **StreetParking.sol**: Maneja las operaciones de estacionamiento:
   - Iniciar/detener sesiones de estacionamiento
   - Gestión de tarifas
   - Manejo de multas por retraso
   - Procesamiento de pagos y retiros

## Características

- 🚗 Gestión de autos como NFTs
- 🔐 Control seguro de propiedad y acceso
- 💰 Cálculo automático de tarifas
- ⏱️ Gestión de estacionamiento basada en tiempo
- 💸 Sistema de multas por retraso
- 👥 Soporte para múltiples conductores por auto
- 💱 Pagos basados en ETH

## Requisitos Previos

- Node.js (v14+)
- npm o yarn
- MetaMask o similar wallet Web3
- Hardhat

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/yourusername/blockchainParking.git
cd blockchainParking
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo `.env` en el directorio raíz con:

```
PRIVATE_KEY=tu_clave_privada
POLY_API_KEY=tu_api_key_de_etherscan
POLYGON_RPC=rpc_en_polygon_o_chain_deseada
```

## Uso

### Compilar Contratos

```bash
npx hardhat compile
```

### Ejecutar Tests

```bash
npx hardhat test --network hardhat
```

### Desplegar en Red Local

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Desplegar en Testnet/Mainnet

```bash
npx hardhat run scripts/deploy.js --network goerli
```

## Interacción con Contratos

### Contrato CarsNFTs

- Acuñar nuevo auto: `mintCar(carNumber)`
- Transferir auto: `transferCar(carNumber, to)`
- Agregar conductor autorizado: `addAllowedPeople(carNumber, person)`
- Remover conductor autorizado: `removeAllowedPeople(carNumber, person)`

### Contrato StreetParking

- Iniciar estacionamiento: `startParking(carNumber, parkingMinutes)`
- Detener estacionamiento: `stopParking(carNumber)`
- Agregar saldo: `addBalanceToCar(carNumber)`
- Pagar multa: `payCarFine(carNumber)`

## Testing

El proyecto incluye tests exhaustivos en el directorio `test`:

- `CarsNFTs.js`: Tests para funcionalidad de NFTs de autos
- Tests adicionales para operaciones del sistema de estacionamiento

## Seguridad

- Contratos OpenZeppelin para implementaciones estándar
- Control de acceso usando patrón Ownable
- Manejo seguro de pagos
- Sistema de gestión de multas

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
