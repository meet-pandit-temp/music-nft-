import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Music, Image, Type } from "lucide-react";
import { useCreateNFT } from "../hooks/useCreateNFT";
import { uploadToPinata } from "../utils/pinataUpload";

const CreateNFT = () => {
  const [signer, setSigner] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    musicFile: null,
    imageFile: null,
    price: "",
    maxSupply: "",
    royaltyPercentage: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const { createNFT, loading, error, tokenId } = useCreateNFT(signer);

  useEffect(() => {
    const connectWallet = async () => {
      if (!window.ethereum) {
        alert("MetaMask not found. Please install it.");
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setSigner(signer);
      } catch (error) {
        console.error("Error getting signer:", error);
      }
    };

    connectWallet();
    window.ethereum?.on("accountsChanged", connectWallet);
    return () => {
      window.ethereum?.removeListener("accountsChanged", connectWallet);
    };
  }, []);

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateInputs = () => {
    const {
      name,
      description,
      musicFile,
      imageFile,
      price,
      maxSupply,
      royaltyPercentage,
    } = formData;
    if (!signer) throw new Error("Please connect your wallet first!");
    if (
      !name ||
      !description ||
      !musicFile ||
      !imageFile ||
      !price ||
      !maxSupply ||
      !royaltyPercentage
    ) {
      throw new Error("All fields are required.");
    }
    if (isNaN(price) || Number(price) <= 0)
      throw new Error("Invalid price. Must be greater than 0.");
    if (isNaN(maxSupply) || Number(maxSupply) <= 0)
      throw new Error("Invalid max supply. Must be greater than 0.");
    const royaltyBPS = Math.floor(parseFloat(royaltyPercentage) * 100);
    if (royaltyBPS < 0 || royaltyBPS > 10000)
      throw new Error("Royalty percentage must be between 0% and 100%.");
  };

  const handleCreateNFT = async () => {
    try {
      setUploadError(null);
      validateInputs();
      setUploading(true);

      const {
        name,
        description,
        musicFile,
        imageFile,
        price,
        maxSupply,
        royaltyPercentage,
      } = formData;
      const musicUrl = await uploadToPinata(musicFile);
      const imageUrl = await uploadToPinata(imageFile);

      const royaltyBPS = Math.floor(parseFloat(royaltyPercentage) * 100);
      const result = await createNFT(
        name.trim(),
        description.trim(),
        musicUrl.trim(),
        imageUrl.trim(),
        price,
        parseInt(maxSupply),
        royaltyBPS
      );

      setFormData({
        name: "",
        description: "",
        musicFile: null,
        imageFile: null,
        price: "",
        maxSupply: "",
        royaltyPercentage: "",
      });
      alert(`NFT created successfully! Token ID: ${result.tokenId}`);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Create Music NFT
        </h2>
        {!signer ? (
          <button
            onClick={() =>
              window.ethereum?.request({ method: "eth_requestAccounts" })
            }
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="space-y-6">
            {Object.keys(formData).map((key) =>
              key.includes("File") ? (
                <input
                  key={key}
                  type="file"
                  name={key}
                  onChange={handleFileChange}
                  accept={key === "musicFile" ? "audio/*" : "image/*"}
                />
              ) : (
                <input
                  key={key}
                  type={
                    key.includes("price") || key.includes("Supply")
                      ? "number"
                      : "text"
                  }
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="p-2 border rounded-lg w-full"
                  placeholder={key}
                />
              )
            )}
            {(error || uploadError) && (
              <div className="text-red-500">
                {error?.message || uploadError}
              </div>
            )}
            <button
              onClick={handleCreateNFT}
              disabled={loading || uploading}
              className="bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              {uploading
                ? "Uploading..."
                : loading
                ? "Creating NFT..."
                : "Create NFT"}
            </button>
            {tokenId && (
              <p className="text-green-600">NFT Created! Token ID: {tokenId}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNFT;
