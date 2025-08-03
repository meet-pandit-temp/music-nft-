import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useState } from 'react';
import { getContract } from '../utils/contract';

export const useNFTListing = (account, refreshOwnedNFTs, refreshMarketNFTs) => {
  const [listingError, setListingError] = useState(null);
  const [isListing, setIsListing] = useState(false);

  const handleListNFT = useCallback(async (nft, listInput) => {
    setListingError(null);
    setIsListing(true);
    
    const price = listInput?.price;
    const amountToList = listInput?.amount;
    
    // Validate price
    let priceBN;
    try {
      if (!price || parseFloat(price) <= 0) throw new Error("Valid price required.");
      priceBN = ethers.parseEther(price);
    } catch (e) {
      alert("Valid price required.");
      setIsListing(false);
      return;
    }
    
    // Validate amount
    let amountBN;
    try {
      if (!amountToList || parseInt(amountToList) <= 0) throw new Error("Valid amount required.");
      amountBN = ethers.toBigInt(amountToList);
      if (amountBN > ethers.toBigInt(nft.balance)) throw new Error("Amount exceeds balance.");
    } catch (e) {
      alert(`Invalid amount: ${e.message}`);
      setIsListing(false);
      return;
    }
    
    console.log(`List attempt: ID ${nft.tokenId}, Amount ${amountToList}, Price ${price} ETH`);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
      // Check if contract is approved to transfer NFTs
      const operatorAddress = await contract.getAddress();
      const isApproved = await contract.isApprovedForAll(account, operatorAddress);
      
      if (!isApproved) {
        alert("Approval needed first.");
        const approvalTx = await contract.setApprovalForAll(operatorAddress, true);
        await approvalTx.wait();
        alert("Approved! Click List again.");
        setIsListing(false);
        return;
      }
      
      // List the NFT
      const listTx = await contract.listNFT(nft.tokenId, amountBN, priceBN);
      alert("Listing tx sent...");
      await listTx.wait();
      alert(`Listed ${amountToList} of ${nft.name} successfully!`);
      
      // Refresh data
      refreshOwnedNFTs();
      refreshMarketNFTs();
    } catch (err) {
      console.error("List Error:", err);
      let reason = "List tx failed.";
      if (err.code === 'ACTION_REJECTED') {
        reason = "Tx rejected.";
      } else if (err.reason) {
        reason = `Failed: ${err.reason}`;
      }
      alert(reason);
      setListingError(reason);
    } finally {
      setIsListing(false);
    }
  }, [account, refreshOwnedNFTs, refreshMarketNFTs]);

  return {
    handleListNFT,
    listingError,
    isListing
  };
};