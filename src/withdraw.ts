import { publicClient, userClient } from "./user";
import { initContract } from "./contracts";
import shmonadAbi from "./abi/shmonad.json";
import { Hex } from "viem";
import { withdrawToEOA } from "./redeem";

const SHMONAD = "0x1b4Cb47622705F0F67b6B18bBD1cB1a91fc77d37" as Hex;

const shMonadContract = await initContract(
  SHMONAD,
  shmonadAbi,
  publicClient,
  userClient
);

const sponsorBalance = await publicClient.getBalance({
    address: userClient.account.address,
});
console.log("sponsor address", userClient.account.address);
console.log("Sponsor MON Balance:", sponsorBalance);

const sponsorShMonBalance = await shMonadContract.read.balanceOf([
    userClient.account.address,
]) as bigint;
console.log("Sponsor shMON Balance:", sponsorShMonBalance);

if (sponsorShMonBalance > 0n) {
  await withdrawToEOA(sponsorShMonBalance, SHMONAD);
}