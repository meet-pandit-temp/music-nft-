//hooks/useNFTBalance

import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";

export const useNFTBalance = (provider, account, tokenId) => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!provider || !account || !tokenId) return;

    const fetchBalance = async () => {
      try {
        const contract = getContract(provider);
        const bal = await contract.balanceOf(account, tokenId);
        setBalance(Number(bal));
      } catch (error) {
        console.error("Error fetching NFT balance:", error);
      }
    };

    fetchBalance();
  }, [provider, account, tokenId]);

  return { balance };
};
