import { Client, getContract, Hex } from "viem";

async function initContract(
  address: Hex,
  abi: any,
  publicClient: Client,
  userClient: Client
) {
  return getContract({
    address: address,
    abi: abi,
    client: {
      public: publicClient,
      account: userClient,
    },
  });
}

function paymasterMode(
  mode: "user" | "sponsor",
  validUntil?: bigint,
  validAfter?: bigint,
  sponsorSignature?: Hex,
  userClient?: Client
) {
  if (mode === "user") {
    return "0x00" as Hex;
  } else {
    if (userClient === undefined) {
      throw new Error("userClient is undefined");
    }
    if (validUntil === undefined) {
      throw new Error("validUntil is undefined");
    }
    if (validAfter === undefined) {
      throw new Error("validAfter is undefined");
    }
    if (sponsorSignature === undefined) {
      throw new Error("sponsorSignature is undefined");
    }

    const accountAddress = userClient.account?.address;
    if (!accountAddress) {
      throw new Error("userClient.account is undefined");
    }
    return `0x01${accountAddress.slice(2)}${validUntil
      .toString(16)
      .padStart(12, "0")}${validAfter
      .toString(16)
      .padStart(12, "0")}${sponsorSignature.slice(2)}`;
  }
}

export { initContract, paymasterMode };
