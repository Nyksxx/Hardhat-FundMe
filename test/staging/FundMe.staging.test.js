const { developments, network, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("1")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("funding and withdrawing..", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()

              const updatedFundMeBalance = await ethers.provider.getBalance(
                  fundMe.address
              )

              assert.equal(updatedFundMeBalance.toString(), "0")
          })
      })
