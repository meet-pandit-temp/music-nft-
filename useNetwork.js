import { useEffect, useState } from "react";
import { ethers } from "ethers";

const OPTIMISM_SEPOLIA_CHAIN_ID = 11155420; // Ensure it's a number

export function useNetworkManager() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChainId, setCurrentChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (!window.ethereum) {
        console.error("MetaMask is not installed!");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const network = await provider.getNetwork();

        const chainId = Number(network.chainId); // Convert BigInt to number
        console.log("Current Chain ID:", chainId); // Debugging log

        setAddress(userAddress);
        setCurrentChainId(chainId);
        setIsConnected(true);
        setIsCorrectNetwork(chainId === OPTIMISM_SEPOLIA_CHAIN_ID);
      } catch (error) {
        console.error("Error fetching wallet details:", error);
      }
    };

    checkNetwork();

    window.ethereum?.on("accountsChanged", checkNetwork);
    window.ethereum?.on("chainChanged", checkNetwork);

    return () => {
      window.ethereum?.removeListener("accountsChanged", checkNetwork);
      window.ethereum?.removeListener("chainChanged", checkNetwork);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      window.location.reload();
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${OPTIMISM_SEPOLIA_CHAIN_ID.toString(16)}` }], // Convert to hex
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch network:", error);
      if (error.code === 4902) {
        alert("Please add Optimism Sepolia manually in MetaMask.");
      }
    }
  };

  return {
    address,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    switchNetwork,
  };
}
