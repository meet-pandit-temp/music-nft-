import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Music, Wallet, LogOut, AlertTriangle } from "lucide-react";
import { ethers } from "ethers";

const OPTIMISM_SEPOLIA_CHAIN_ID = "0xaa36a7"; // Hexadecimal for 11155420

const Navbar = () => {
  const [address, setAddress] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const checkNetwork = async () => {
    if (!window.ethereum) {
      console.error("MetaMask is not installed!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      const chainId = Number(network.chainId); // Convert BigInt to number
      console.log("Current Chain ID:", chainId); // Debugging log
      setIsCorrectNetwork(chainId === 11155420);
    } catch (error) {
      console.error("Error checking network:", error);
    }
  };

  // Call `checkNetwork()` inside useEffect
  useEffect(() => {
    checkNetwork();
    window.ethereum?.on("accountsChanged", checkNetwork);
    window.ethereum?.on("chainChanged", checkNetwork);

    return () => {
      window.ethereum?.removeListener("accountsChanged", checkNetwork);
      window.ethereum?.removeListener("chainChanged", checkNetwork);
    };
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert(
          "MetaMask is not installed. Please install it to connect your wallet."
        );
        return;
      }

      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log("Connected account:", userAddress);

      // Update state
      setAddress(userAddress);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: OPTIMISM_SEPOLIA_CHAIN_ID }],
      });
      checkNetwork();
    } catch (error) {
      console.error("Network switch failed:", error);
      if (error.code === 4902) {
        alert("Please add Optimism Sepolia network manually in MetaMask.");
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    setAddress(accounts.length > 0 ? accounts[0] : null);
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <nav className="bg-black bg-opacity-50 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Music className="text-white" size={24} />
            <span className="text-white text-xl font-bold">Music NFT</span>
          </div>
          <div className="flex items-center space-x-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-white hover:text-purple-300 transition-colors ${
                  isActive ? "text-purple-300 font-semibold" : ""
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `text-white hover:text-purple-300 transition-colors ${
                  isActive ? "text-purple-300 font-semibold" : ""
                }`
              }
            >
              Create NFT
            </NavLink>
            <NavLink
              to="/sell"
              className={({ isActive }) =>
                `text-white hover:text-purple-300 transition-colors ${
                  isActive ? "text-purple-300 font-semibold" : ""
                }`
              }
            >
              Sell NFT
            </NavLink>
          </div>
        </div>
        {address ? (
          <div className="flex items-center space-x-4">
            {!isCorrectNetwork && (
              <button
                onClick={switchNetwork}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <AlertTriangle size={20} />
                <span>Switch to Optimism Sepolia</span>
              </button>
            )}
            <span className="text-white">{formatAddress(address)}</span>
            <button
              onClick={() => setAddress(null)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Wallet size={20} />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
