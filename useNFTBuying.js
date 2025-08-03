import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';

export const useNFTBuying = (account, refreshOwnedNFTs, refreshMarketNFTs) => {
  const [buyingError, setBuyingError] = useState(null);
  const [isBuying, setIsBuying] = useState(false);

  const handleBuyNFT = useCallback(async (listing, amountToBuyStr) => {
    setBuyingError(null);
    setIsBuying(true);

    // Validate amount
    let amountToBuyBN;
    try {
      if (!amountToBuyStr || parseInt(amountToBuyStr) <= 0) throw new Error("Amount must be positive.");
      amountToBuyBN = ethers.toBigInt(amountToBuyStr);
      if (amountToBuyBN > ethers.toBigInt(listing.availableAmount)) {
        throw new Error(`Amount (${amountToBuyStr}) exceeds available amount (${listing.availableAmount}).`);
      }
    } catch(e) {
      alert(`Invalid amount: ${e.message || 'Please enter valid number.'}`);
      setIsBuying(false);
      return;
    }

    // Calculate total cost
    let totalCostWei;
    try {
      totalCostWei = ethers.toBigInt(listing.price) * amountToBuyBN;
    } catch (e) {
      alert("Could not calculate total cost.");
      console.error("Cost calculation error", e);
      setIsBuying(false);
      return;
    }

    console.log(`Buy attempt: ID ${listing.tokenId}, Seller ${listing.seller}, Amount ${amountToBuyStr}, Cost ${ethers.formatEther(totalCostWei)} ETH`);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      console.log(`Calling buyListedNFT(${listing.tokenId}, ${listing.seller}, ${amountToBuyBN.toString()}) with value ${totalCostWei.toString()}`);

      const buyTx = await contract.buyListedNFT(
        listing.tokenId,
        listing.seller,
        amountToBuyBN,
        { value: totalCostWei }
      );

      alert("Buy transaction sent! Waiting for confirmation...");
      await buyTx.wait();
      alert(`Successfully bought ${amountToBuyStr} of ${listing.name}!`);

      // Refresh both lists after successful purchase
      refreshOwnedNFTs();
      refreshMarketNFTs();
    } catch (err) {
      console.error("Error buying NFT:", err);
      let reason = "Buy transaction failed. Check console.";
      if (err.code === 'ACTION_REJECTED') { 
        reason = "Transaction rejected."; 
      } else if (err.reason) { 
        reason = `Failed: ${err.reason}`; 
      }
      alert(reason);
      setBuyingError(reason);
    } finally {
      setIsBuying(false);
    }
  }, [account, refreshOwnedNFTs, refreshMarketNFTs]);

  return {
    handleBuyNFT,
    buyingError,
    isBuying
  };
};