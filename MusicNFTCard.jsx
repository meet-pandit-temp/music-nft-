import React, { useState } from "react";
import { useMintNFT } from "../hooks/useMintNFT";
import { toast } from "react-toastify";

const getIPFSUrl = (ipfsUrl) => {
  if (!ipfsUrl || ipfsUrl === "" || ipfsUrl === '""') {
    return "/placeholder-music.png";
  }

  try {
    ipfsUrl = ipfsUrl.replace(/['"]+/g, "");
    if (ipfsUrl.startsWith("ipfs://")) {
      return ipfsUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    if (ipfsUrl.startsWith("https://gateway.pinata.cloud")) {
      return ipfsUrl;
    }
    if (ipfsUrl.match(/^[a-zA-Z0-9]{46,59}$/)) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }
    return "/placeholder-music.png";
  } catch (error) {
    console.error("Error formatting IPFS URL:", error);
    return "/placeholder-music.png";
  }
};

const MusicNFTCard = ({ nft }) => {
  const [imageError, setImageError] = useState(false);
  const { mintNFT, loading } = useMintNFT();

  const handleBuyNow = async () => {
    if (!nft?.isActive) {
      alert("This NFT is not available for minting");
      return;
    }

    await mintNFT(nft.tokenId, nft.price);
  };

  if (!nft) return null;

  const imageUrl = nft.image || nft.imageUrl;
  const musicUrl = nft.musicUrl || ""; // Ensure music URL is captured

  console.log("NFT Data in Card:", {
    tokenId: nft.tokenId,
    name: nft.name,
    imageUrl: imageUrl,
    formattedImageUrl: getIPFSUrl(imageUrl),
    musicUrl: musicUrl,
    formattedMusicUrl: getIPFSUrl(musicUrl),
  });

  const handleImageError = (e) => {
    console.error("Image loading failed for NFT:", nft.tokenId);
    setImageError(true);
    e.target.src = "/placeholder-music.png";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full">
      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
        {!imageError && imageUrl ? (
          <img
            src={getIPFSUrl(imageUrl)}
            alt={nft.name || "Music NFT"}
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-purple-50">
            <div className="text-center">
              <span className="text-4xl">🎵</span>
              <p className="text-sm text-gray-500 mt-2">
                {nft.name || "Music NFT"}
              </p>
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mt-2 truncate">
        {nft.name || `NFT #${nft.tokenId}`}
      </h2>

      {nft.description && (
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
          {nft.description}
        </p>
      )}

      <p className="text-gray-600 truncate mt-2">
        Creator:{" "}
        {nft.creator
          ? `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}`
          : "Unknown"}
      </p>

      <p className="text-purple-600 font-bold mt-1">
        {nft.price ? `${Number(nft.price).toFixed(4)} ETH` : "N/A"}
      </p>

      {nft.maxSupply > 0 && (
        <p className="text-sm text-gray-500 mt-1">
          Supply: {nft.currentSupply || 0}/{nft.maxSupply}
        </p>
      )}

      {musicUrl && (
        <div className="mt-3">
          <audio controls className="w-full">
            <source src={getIPFSUrl(musicUrl)} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <button
        onClick={handleBuyNow}
        disabled={!nft.isActive || loading}
        className={`w-full mt-4 py-2 rounded-lg flex items-center justify-center gap-2
          ${
            nft.isActive && !loading
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }
        `}
      >
        {loading ? (
          <>
            <span className="animate-spin">↻</span>
            Processing...
          </>
        ) : (
          <>
            <span>🛒</span>
            Buy Now ({nft.price} ETH)
          </>
        )}
      </button>
    </div>
  );
};

export default MusicNFTCard;
