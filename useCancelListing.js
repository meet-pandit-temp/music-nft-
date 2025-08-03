//hooks/useCancelListing

import { useState } from "react";
import { getContract } from "../utils/contract";

export const useCancelListing = (signer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cancelListing = async (tokenId) => {
    setLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.cancelListing(tokenId);
      await tx.wait();
      return tx;
    } catch (error) {
      setError(error);
      console.error("Error canceling listing:", error);
    } finally {
      setLoading(false);
    }
  };

  return { cancelListing, loading, error };
};
