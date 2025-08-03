import { useState } from "react";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

export const useCreateNFT = (signer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenId, setTokenId] = useState(null);

  const createNFT = async (
    name,
    description,
    musicUrl,
    imageUrl,
    price,
    maxSupply,
    royaltyBPS
  ) => {
    setLoading(true);
    setError(null);
    setTokenId(null);

    try {
      if (!signer)
        throw new Error(
          " Wallet is not connected. Please connect your wallet."
        );

      const formattedPrice = ethers.parseEther(price.toString());
      const contract = getContract(signer);

      console.log(" Creating NFT with:", {
        name,
        description,
        musicUrl,
        imageUrl,
        formattedPrice,
        maxSupply,
        royaltyBPS,
      });

      const tx = await contract.createMusicNFT(
        name.trim(),
        description.trim(),
        musicUrl.trim(),
        imageUrl.trim(),
        formattedPrice,
        Number(maxSupply),
        Number(royaltyBPS),
        {
          gasLimit: 500000n, //  Uses BigInt for ethers v6 compatibility
        }
      );

      console.log(" Transaction sent:", tx.hash);
      const receipt = await tx.wait(2);
      if (receipt.status !== 1)
        throw new Error(" Transaction failed on-chain.");

      // 🔹 Extract Token ID from Event Logs
      const event = receipt.logs.find((log) => log.address === contract.target);
      const parsedLog = contract.interface.parseLog(event);

      if (parsedLog && parsedLog.name === "NFTCreated") {
        const newTokenId = parsedLog.args[0].toString();
        setTokenId(newTokenId);
        console.log(` NFT Created Successfully! Token ID: ${newTokenId}`);
        return { tx, receipt, tokenId: newTokenId };
      } else {
        console.warn(" Token ID not found in event logs.");
      }

      return { tx, receipt };
    } catch (err) {
      console.error(" NFT Creation failed:", err);
      setError(err.reason || err.message || "NFT creation failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createNFT, loading, error, tokenId };
};
