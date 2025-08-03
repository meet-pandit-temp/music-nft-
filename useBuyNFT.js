//hooks/useBuyNFT

import { useState } from "react";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

export const useBuyNFT = (signer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buyNFT = async (tokenId, seller, amount, value) => {
    setLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.buyListedNFT(tokenId, seller, amount, {
        value: ethers.utils.parseUnits(value.toString(), "wei"), // Ensure value is in wei
      });
      await tx.wait();
      return tx;
    } catch (error) {
      setError(error);
      console.error("Error buying NFT:", error);
    } finally {
      setLoading(false);
    }
  };

  return { buyNFT, loading, error };
};
