//hooks/useUserListing

import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";

export const useUserListings = (provider, userAddress) => {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (!provider || !userAddress) return;

    const fetchUserListings = async () => {
      try {
        const contract = getContract(provider);
        const tokenIds = await contract.totalSupply();

        const userListings = [];
        for (let tokenId = 1; tokenId <= tokenIds; tokenId++) {
          try {
            const listing = await contract.getListing(tokenId, userAddress);

            if (listing.seller === userAddress && listing.amount > 0) {
              const metadata = await contract.getNFTMetadata(tokenId);
              userListings.push({
                tokenId,
                ...metadata,
                listingPrice: listing.price,
                listingAmount: listing.amount,
              });
            }
          } catch (error) {
            console.error(
              `Error checking listing for token ${tokenId}:`,
              error
            );
          }
        }

        setListings(userListings);
      } catch (error) {
        console.error("Error fetching user listings:", error);
      }
    };

    fetchUserListings();
  }, [provider, userAddress]);

  return { listings };
};
