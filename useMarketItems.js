//hooks/useMarketItems

import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";

export const useMarketItems = (provider) => {
  const [marketItems, setMarketItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketItems = async () => {
      if (!provider) return;
      setLoading(true);
      try {
        const contract = getContract(provider);
        const tokenIds = await contract.totalSupply();

        const items = [];
        for (let tokenId = 1; tokenId <= tokenIds; tokenId++) {
          try {
            const metadata = await contract.getNFTMetadata(tokenId);
            const listing = await contract.getListing(
              tokenId,
              contract.signer.getAddress()
            );

            if (listing.amount > 0) {
              items.push({
                tokenId,
                ...metadata,
                listingPrice: listing.price,
                listingAmount: listing.amount,
              });
            }
          } catch (error) {
            console.error(
              `Error fetching details for token ${tokenId}:`,
              error
            );
          }
        }

        setMarketItems(items);
      } catch (error) {
        console.error("Error fetching market items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketItems();
  }, [provider]);

  return { marketItems, loading };
};
