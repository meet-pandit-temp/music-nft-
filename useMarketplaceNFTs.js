import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';
import { fetchContractMetadata } from '../utils/nftUtils';

export const useMarketplaceNFTs = (account, alchemy) => {
  const [marketNfts, setMarketNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buyInputs, setBuyInputs] = useState({});

  const fetchMarketNfts = useCallback(async () => {
    if (!alchemy) return;
    setLoading(true);
    setError(null);
    console.log(`Fetching MARKET NFTs with account:`, account);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = getContract(provider);
      const contractAddress = await contract.getAddress();
      console.log("Contract address:", contractAddress);

      // Get all NFTs
      const allNfts = await contract.getAllMusicNFTs();
      console.log("All NFTs from contract:", allNfts);

      if (!allNfts || allNfts.length === 0) {
        console.log("No NFTs found in contract");
        setMarketNfts([]);
        return;
      }

      const marketListings = [];
      const metadataCache = {};

      // Process each NFT
      for (const nftInfo of allNfts) {
        try {
          // Skip if NFT info is invalid
          if (!nftInfo || !nftInfo.tokenId) {
            console.log("Skipping invalid NFT info:", nftInfo);
            continue;
          }

          const tokenId = nftInfo.tokenId.toString();
          console.log(`\nProcessing NFT ${tokenId}:`, {
            name: nftInfo.name,
            creator: nftInfo.creator,
            currentSupply: nftInfo.currentSupply.toString(),
            maxSupply: nftInfo.maxSupply.toString(),
            isActive: nftInfo.isActive
          });
          
          // Get metadata
          if (!metadataCache[tokenId]) {
            metadataCache[tokenId] = {
              name: nftInfo.name || `NFT #${tokenId}`,
              description: nftInfo.description || "",
              imageUrl: nftInfo.imageUrl || "",
              musicUrl: nftInfo.musicUrl || ""
            };
          }
          const metadata = metadataCache[tokenId];

          // First check if current user has a listing
          if (account) {
            try {
              const userListing = await contract.getListing(tokenId, account);
              console.log(`Current user listing for token ${tokenId}:`, userListing);
              
              if (userListing && ethers.toBigInt(userListing.amount || 0) > 0n) {
                const listingId = `${contractAddress}-${tokenId}-${account}`;
                const isCreator = account.toLowerCase() === nftInfo.creator.toLowerCase();
                
                marketListings.push({
                  listingId,
                  tokenId,
                  seller: account,
                  price: userListing.price,
                  availableAmount: userListing.amount.toString(),
                  name: metadata.name,
                  imageUrl: metadata.imageUrl,
                  creator: nftInfo.creator,
                  isCreator,
                  isActive: true,
                  currentSupply: nftInfo.currentSupply.toString(),
                  maxSupply: nftInfo.maxSupply.toString()
                });
                console.log(`Added user's listing for token ${tokenId}`);
              }
            } catch (e) {
              console.log(`No listing found for current user for token ${tokenId}`);
            }
          }

          // Then check creator's listing if creator is not the current user
          if (nftInfo.creator.toLowerCase() !== account?.toLowerCase()) {
            try {
              const creatorListing = await contract.getListing(tokenId, nftInfo.creator);
              console.log(`Creator listing for token ${tokenId}:`, creatorListing);
              
              if (creatorListing && ethers.toBigInt(creatorListing.amount || 0) > 0n) {
                const listingId = `${contractAddress}-${tokenId}-${nftInfo.creator}`;
                marketListings.push({
                  listingId,
                  tokenId,
                  seller: nftInfo.creator,
                  price: creatorListing.price,
                  availableAmount: creatorListing.amount.toString(),
                  name: metadata.name,
                  imageUrl: metadata.imageUrl,
                  creator: nftInfo.creator,
                  isCreator: true,
                  isActive: true,
                  currentSupply: nftInfo.currentSupply.toString(),
                  maxSupply: nftInfo.maxSupply.toString()
                });
                console.log(`Added creator's listing for token ${tokenId}`);
              }
            } catch (e) {
              console.log(`No creator listing found for token ${tokenId}`);
            }
          }

          // Get all transfer events to find other holders
          const filter = contract.filters.TransferSingle(null, null, null, tokenId, null);
          const events = await contract.queryFilter(filter);
          const uniqueHolders = new Set();

          // Add all recipients from transfer events (excluding creator and current user)
          events.forEach(event => {
            const holder = event.args[2];
            if (holder.toLowerCase() !== nftInfo.creator.toLowerCase() && 
                holder.toLowerCase() !== account?.toLowerCase()) {
              uniqueHolders.add(holder);
            }
          });

          console.log(`Found ${uniqueHolders.size} other holders for token ${tokenId}`);

          // Check listings for other holders
          for (const holder of uniqueHolders) {
            try {
              const listing = await contract.getListing(tokenId, holder);
              console.log(`Checking listing for token ${tokenId} from holder ${holder}:`, listing);
              
              if (listing && ethers.toBigInt(listing.amount || 0) > 0n) {
                const listingId = `${contractAddress}-${tokenId}-${holder}`;
                marketListings.push({
                  listingId,
                  tokenId,
                  seller: holder,
                  price: listing.price,
                  availableAmount: listing.amount.toString(),
                  name: metadata.name,
                  imageUrl: metadata.imageUrl,
                  creator: nftInfo.creator,
                  isCreator: false,
                  isActive: true,
                  currentSupply: nftInfo.currentSupply.toString(),
                  maxSupply: nftInfo.maxSupply.toString()
                });
                console.log(`Added holder's listing for token ${tokenId}`);
              }
            } catch (e) {
              console.log(`No listing found for holder ${holder} for token ${tokenId}`);
            }
          }
        } catch (e) {
          console.warn(`Error processing NFT ${nftInfo?.tokenId}:`, e);
        }
      }

      console.log("\nFinal market listings:", marketListings);
      setMarketNfts(marketListings);
      
      // Initialize buy inputs
      const initialBuyInputs = marketListings.reduce((acc, listing) => { 
        acc[listing.listingId] = ''; 
        return acc; 
      }, {});
      setBuyInputs(initialBuyInputs);
    } catch (err) {
      console.error("Error fetching MARKET NFTs:", err);
      setError("Could not fetch marketplace listings. Check console.");
    } finally { 
      setLoading(false); 
    }
  }, [alchemy, account]);

  useEffect(() => {
    if (alchemy) {
      fetchMarketNfts();
    } else {
      setMarketNfts([]);
      setBuyInputs({});
    }
  }, [alchemy, fetchMarketNfts]);

  const handleBuyInputChange = (listingId, value) => {
    setBuyInputs(prevInputs => ({ ...prevInputs, [listingId]: value }));
  };

  return {
    marketNfts,
    loading,
    error,
    buyInputs,
    handleBuyInputChange,
    refreshMarketNFTs: fetchMarketNfts
  };
};