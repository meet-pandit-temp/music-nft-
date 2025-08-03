import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

const useFetchMusicNFTs = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to validate and format IPFS URLs
  const formatIPFSUrl = (url) => {
    if (!url) return "";
    // Handle IPFS URLs
    if (url.startsWith("ipfs://")) {
      return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    // Handle if the URL is already a gateway URL
    if (url.includes("gateway.pinata.cloud")) {
      return url;
    }
    // Handle if it's just a CID
    if (url.match(/^[a-zA-Z0-9]{46,59}$/)) {
      return `https://gateway.pinata.cloud/ipfs/${url}`;
    }
    return url;
  };

  const fetchNFTs = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("Ethereum wallet is required");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const nftData = await contract.getAllMusicNFTs();
      console.log("Raw NFT Data from Contract:", nftData);

      const formattedNFTs = nftData.map((nft, index) => ({
        tokenId: nft.tokenId ? Number(nft.tokenId) : index,
        name: nft.name || "Unknown Song",
        image: nft.imageUrl || "", // Changed from image to imageUrl
        musicUrl: nft.musicUrl || "",
        price: nft.price ? ethers.formatEther(nft.price) : "0",
        maxSupply: nft.maxSupply ? Number(nft.maxSupply) : 0,
        creator: nft.creator || "Unknown",
        description: nft.description || "",
        currentSupply: nft.currentSupply ? Number(nft.currentSupply) : 0,
        royaltyBPS: nft.royaltyBPS ? Number(nft.royaltyBPS) : 0,
        isActive: nft.isActive,
      }));

      console.log("Formatted NFTs:", formattedNFTs);
      setNfts(formattedNFTs);
      setError(null);
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError(err.message);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initFetch = async () => {
      try {
        await fetchNFTs();
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initFetch();

    return () => {
      mounted = false;
    };
  }, [fetchNFTs]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = () => fetchNFTs();
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [fetchNFTs]);

  return {
    nfts,
    loading,
    error,
    refreshNFTs: fetchNFTs,
  };
};

export default useFetchMusicNFTs;
