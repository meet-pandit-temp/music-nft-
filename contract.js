import { ethers } from "ethers";
import contractABI from "../../artifacts/contracts/MusicNFTMarketplace.sol/MusicNFTMarketplace.json" assert { type: "json" };

const contractAddress = "0xCd592E28682744Ff53201FBf37592e531314c12D"; // Ensure this is correct

export const getContract = (providerOrSigner) => {
  if (!providerOrSigner) throw new Error("Provider or Signer is required");

  return new ethers.Contract(
    contractAddress,
    contractABI.abi,
    providerOrSigner
  );
};
