import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    setError(null);
    
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        console.log("Wallet connected:", accounts[0]);
        return { success: true, account: accounts[0] };
      } catch (err) {
        console.error("Wallet connection error:", err);
        const message = (err.code === 4001 || err.message?.includes("User rejected"))
          ? "Connection request rejected."
          : "Wallet connection failed.";
        setError(message);
        return { success: false, error: message };
      }
    } else {
      const message = "MetaMask is not installed or detected.";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  const getProvider = useCallback(async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        return new ethers.BrowserProvider(window.ethereum);
      } catch (err) {
        console.error("Error creating provider:", err);
        throw err;
      }
    } else {
      throw new Error("MetaMask is not installed");
    }
  }, []);

  const getSigner = useCallback(async () => {
    const provider = await getProvider();
    return provider.getSigner();
  }, [getProvider]);

  return { 
    account, 
    error, 
    connectWallet, 
    disconnectWallet, 
    getProvider,
    getSigner
  };
};


export default useWallet;