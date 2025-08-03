import React from "react";
import useFetchMusicNFTs from "../hooks/useFetchMusicNFTs";
import useWallet from "../hooks/useWallet";
import MusicNFTCard from "../components/MusicNFTCard";
import { toast } from "react-toastify";

const Home = () => {
  const { account } = useWallet();
  const { nfts, loading, error, refreshNFTs } = useFetchMusicNFTs();

  const handleBuyNFT = async (tokenId, price) => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // This assumes your MusicNFTCard will handle the actual minting
      console.log("Initiating purchase for NFT:", tokenId, "Price:", price);
      // The card component will call useMintNFT hook directly
    } catch (error) {
      toast.error(`Failed to initiate purchase: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8">
        Featured Music NFTs
      </h1>

      {loading && <p className="text-white">Loading NFTs...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft, index) => (
          <MusicNFTCard
            key={nft.tokenId || index}
            nft={nft}
            account={account} // Pass account to card
            onBuy={() => handleBuyNFT(nft.tokenId, nft.price)}
            onMintSuccess={refreshNFTs} // Refresh list after mint
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
