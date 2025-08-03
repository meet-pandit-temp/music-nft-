import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { toast } from "react-toastify";

export const useMintNFT = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mintNFT = async (tokenId, price) => {
    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      // Convert ETH price to wei
      const totalCost = ethers.parseEther(price.toString());

      // Send transaction
      const tx = await contract.mintNFT(tokenId, 1, {
        value: totalCost,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      // Show success toast with plain text
      toast.success("NFT minted successfully! Click to view on Etherscan", {
        onClick: () => {
          window.open(`https://etherscan.io/tx/${tx.hash}`, "_blank");
        },
      });

      return { tx, receipt };
    } catch (error) {
      console.error("Minting error:", error);
      setError(error);

      // User-friendly error messages
      let errorMessage = "Minting failed";
      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction cancelled";
      }

      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { mintNFT, loading, error };
};
