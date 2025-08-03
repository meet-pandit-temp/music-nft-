//hooks/useListNFT

import { useState } from "react";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

export const useListNFT = (signer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listNFT = async (tokenId, amount, price) => {
    setLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.listNFT(
        tokenId,
        amount,
        ethers.utils.parseUnits(price.toString(), "wei") // Ensure price is in wei
      );
      await tx.wait();
      return tx;
    } catch (error) {
      setError(error);
      console.error("Error listing NFT:", error);
    } finally {
      setLoading(false);
    }
  };

  return { listNFT, loading, error };
};
