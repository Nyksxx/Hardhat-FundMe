//async function deployFunction() {
//    console.log("Hi")
//}

//module.exports.default = deployFunction

const { getNamedAccounts, deployments, network } = require("hardhat")

const { networkConfig, developmentChains } = require("../helper-hardhat-config")

const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //const ethUSDPriceFeedAddress = networkConfig[chainId]["ethUSDPriceFeed"]

    let ethUSDPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const ethUSDAggerator = await deployments.get("MockV3Aggregator")
        ethUSDPriceFeedAddress = ethUSDAggerator.address
    } else {
        ethUSDPriceFeedAddress = networkConfig[chainId]["ethUSDPriceFeed"]
    }

    const args = [ethUSDPriceFeedAddress]

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConformations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    log("-------------------------------")
}

module.exports.tags = ["all", "fundme"]
