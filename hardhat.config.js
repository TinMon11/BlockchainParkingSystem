require("@nomicfoundation/hardhat-toolbox");

const dotenv = require("dotenv");

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "bscTestnet",
  networks: {
    hardhat: {},
    bscTestnet: {
      url: process.env.RPC,
      network_id: 97,
      accounts: [process.env.PRIVATE_KEY],
    },
  },

  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSC_API_KEY,
    },
  },
};
