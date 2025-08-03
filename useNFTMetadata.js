//hooks/useNFTMETadata

import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";

export const useNFTMetadata = (provider, tokenId) => {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (!provider || !tokenId) return;

    const fetchMetadata = async () => {
      try {
        const contract = getContract(provider);
        const data = await contract.getNFTMetadata(tokenId);
        setMetadata({
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          musicUrl: data.musicUrl,
          creator: data.creator,
          maxSupply: data.maxSupply,
          currentSupply: data.currentSupply,
          royaltyBPS: data.royaltyBPS,
        });
      } catch (error) {
        console.error("Error fetching NFT metadata:", error);
      }
    };

    fetchMetadata();
  }, [provider, tokenId]);

  return { metadata };
};
