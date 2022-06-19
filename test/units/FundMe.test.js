const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture("all")
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("controlling aggregator address on constructor", async function () {
                  const response = await fundMe.priceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("fund", async function () {
              it("Fails if you dont send enough eth !", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You didnt send enough eth!"
                  )
              })
              it("updated amount of fund", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.addresstoAmountFunded(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("controlling funders array ", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.funders(0)
                  assert.equal(funder, deployer)
              })
              describe("withdraw", async function () {
                  beforeEach(async function () {
                      await fundMe.fund({ value: sendValue })
                  })
                  it("withdrawing eth ", async function () {
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingFunderBalance =
                          await fundMe.provider.getBalance(deployer)
                      const transaction = await fundMe.withdraw()
                      const waitTransaction = await transaction.wait(1)
                      const { gasUsed, effectiveGasPrice } = waitTransaction
                      const gasCost = gasUsed.mul(effectiveGasPrice)

                      const updatedFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const updatedFunderBalance =
                          await fundMe.provider.getBalance(deployer)

                      assert.equal(
                          startingFundMeBalance
                              .add(startingFunderBalance)
                              .toString(),
                          updatedFunderBalance.add(gasCost).toString()
                      )
                  })
                  it("withdrawing eth with multiple accounts", async function () {
                      const accounts = await ethers.getSigners()
                      for (
                          let accountsIndex = 1;
                          accountsIndex < accounts.length;
                          accountsIndex++
                      ) {
                          const connectedAccount = await fundMe.connect(
                              accounts[accountsIndex]
                          )
                          await connectedAccount.fund({ value: sendValue })
                      }
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingFunderBalance =
                          await fundMe.provider.getBalance(deployer)

                      const transaction = await fundMe.withdraw()
                      const waitTransaction = await transaction.wait(1)

                      const { gasUsed, effectiveGasPrice } = waitTransaction
                      const gasCost = gasUsed.mul(effectiveGasPrice)

                      const updatedFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const updatedFunderBalance =
                          await fundMe.provider.getBalance(deployer)

                      assert.equal(
                          startingFundMeBalance
                              .add(startingFunderBalance)
                              .toString(),
                          updatedFunderBalance.add(gasCost).toString()
                      )
                      await expect(fundMe.funders(0)).to.be.reverted

                      for (
                          let accountsIndex = 1;
                          accountsIndex < accounts.length;
                          accountsIndex++
                      ) {
                          assert.equal(
                              await fundMe.addresstoAmountFunded(
                                  accounts[accountsIndex].address
                              ),
                              0
                          )
                      }
                  })
                  it("Only the owner of the contract should be able to call withdraw function", async function () {
                      const accounts = await ethers.getSigners()
                      const attacker = accounts[1]
                      const connectAttacker = await fundMe.connect(attacker)

                      await expect(
                          connectAttacker.withdraw()
                      ).to.be.revertedWith("FundMe__notOwner")
                  })
              })
          })
      })
