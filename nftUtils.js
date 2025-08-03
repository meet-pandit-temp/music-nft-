import { ethers } from "ethers";

export async function fetchContractMetadata(contract, tokenId) {
  let metadata = { name: "Unknown NFT", imageUrl: "/placeholder.png", musicUrl: "", description: "" };
  if (!contract) {
    console.error(`fetchContractMetadata: Invalid contract instance for token ${tokenId}.`);
    return { ...metadata, name: "Contract Error" };
  }
  if (typeof contract.getNFTMetadata === 'function') {
    try {
      const data = await contract.getNFTMetadata(tokenId);
      metadata = {
        name: data.name || "Unnamed NFT", imageUrl: data.imageUrl || "/placeholder.png",
        musicUrl: data.musicUrl || "", description: data.description || "", creator: data.creator,
        price: data.price, maxSupply: data.maxSupply, currentSupply: data.currentSupply,
        royaltyBPS: data.royaltyBPS, isActive: data.isActive,
      };
      return metadata;
    } catch (error) { console.warn(`getNFTMetadata failed for ${tokenId}, trying uri():`, error); }
  } else { console.warn(`Contract missing getNFTMetadata for ${tokenId}. Trying uri().`); }

  if (typeof contract.uri !== 'function') {
    console.warn(`Contract missing uri function for ${tokenId}. Cannot fetch metadata.`);
    return { ...metadata, name: "Metadata Function Missing" };
  }
  try {
    let uri = await contract.uri(tokenId);
    if (!uri) return metadata;
    if (uri.startsWith("ipfs://")) { uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/"); }
    if (uri.startsWith("data:application/json;base64,")) {
      const base64String = uri.split(',')[1];
      let jsonString = typeof atob !== 'undefined' ? atob(base64String) : Buffer.from(base64String, 'base64').toString('utf8');
      const parsedData = JSON.parse(jsonString);
      metadata = { name: parsedData.name || "Unnamed NFT", imageUrl: parsedData.image || parsedData.imageUrl || "/placeholder.png", musicUrl: parsedData.animation_url || parsedData.music_url || "", description: parsedData.description || "" };
    } else if (uri.startsWith('http')) {
      const response = await fetch(uri);
      if (!response.ok) { metadata.name = "Metadata Fetch Failed"; }
      else { const parsedData = await response.json(); metadata = { name: parsedData.name || "Unnamed NFT", imageUrl: parsedData.image || parsedData.imageUrl || "/placeholder.png", musicUrl: parsedData.animation_url || parsedData.music_url || "", description: parsedData.description || "" }; }
    } else { metadata.name = "Unsupported URI"; }
    return metadata;
  } catch (error) { console.error(`Error via uri() for ${tokenId}:`, error); return { ...metadata, name: "Metadata Error" }; }
}