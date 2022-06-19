//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

contract FundMe {
    using PriceConverter for uint256;

    address owner;

    uint256 public constant minimumUSD = 50 * 1e18;

    address[] public funders;

    mapping(address => uint256) public addresstoAmountFunded;

    error FundMe__notOwner();

    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert FundMe__notOwner();
        }
        _;
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) > minimumUSD,
            "You need to pay more!"
        );
        funders.push(msg.sender);
        addresstoAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addresstoAmountFunded[funder] = 0;
        }
        funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Failed!");
    }

    function cheapWithdraw() public payable {
        address[] memory funder = funders;

        for (uint256 funderIndex; funderIndex < funder.length; funderIndex++) {
            address cheapFunder = funder[funderIndex];
            addresstoAmountFunded[cheapFunder] = 0;
        }
        funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Failed!");
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    // view, pure
}
