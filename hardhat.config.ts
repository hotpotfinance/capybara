import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-etherscan"
import "hardhat-gas-reporter"

import { realWallet, testWallet, bscApiKey, ethApiKey, infraApiKey } from './secrets.json';

export default {
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        rinkeby: {
            url: "https://rinkeby.infura.io/v3/" + infraApiKey,
            chainId: 4,
            accounts: [testWallet]
        },
        bscTestnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            accounts: [testWallet]
        },
        bsc: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            accounts: [realWallet]
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
                settings: {
                    optimizer: {
                        enabled: true
                    }
                }
            },
        ]
    },
    gasReporter: {
        enabled: false
    },
    etherscan: {
        apiKey: {
            bscTestnet: bscApiKey,
            bsc: bscApiKey,
            rinkeby: ethApiKey
        }
    }
}
