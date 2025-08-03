import axios from "axios";

export const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const pinataMetadata = JSON.stringify({ name: file.name });
  formData.append("pinataMetadata", pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 0 });
  formData.append("pinataOptions", pinataOptions);

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Pinata Response:", res.data);
    return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
  } catch (err) {
    console.error("IPFS Upload Error:", err);
    alert(`IPFS Upload Failed: ${err.response?.data?.error || err.message}`);
    throw err;
  }
};
