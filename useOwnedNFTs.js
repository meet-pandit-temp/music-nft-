import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';
import { fetchContractMetadata } from '../utils/nftUtils';

export const useOwnedNFTs = (account, alchemy) => {
  const [ownedNfts, setOwnedNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listInputs, setListInputs] = useState({});

  const fetchOwnedNFTs = useCallback(async (userAddress) => {
    if (!userAddress || !alchemy) return;
    setLoading(true);
    setError(null);
    console.log(`Fetching OWNED NFTs for ${userAddress}`);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = getContract(provider);
      const contractAddress = await contract.getAddress();
      const nftsForOwner = await alchemy.nft.getNftsForOwner(userAddress, { contractAddresses: [contractAddress] });
      const fetchedNftsData = [];
      if (nftsForOwner?.ownedNfts?.length > 0) {
        const metadataPromises = nftsForOwner.ownedNfts
          .filter(nft => nft.tokenType === "ERC1155" && nft.balance && parseInt(nft.balance, 16) > 0)
          .map(async (nft) => {
            const tokenId = nft.tokenId;
            const balance = ethers.toBigInt(nft.balance).toString();
            const metadata = await fetchContractMetadata(contract, tokenId);
            return {
              id: `${contractAddress}-${tokenId}`, contractAddress, tokenId: tokenId.toString(), balance,
              name: metadata.name, imageUrl: metadata.imageUrl !== "/placeholder.png" ? metadata.imageUrl : (nft.media?.[0]?.gateway || nft.rawMetadata?.image || "/placeholder.png"),
            };
          });
        fetchedNftsData.push(...(await Promise.all(metadataPromises)));
      }
      setOwnedNfts(fetchedNftsData);
      const initialInputs = fetchedNftsData.reduce((acc, nft) => { acc[nft.id] = { price: '', amount: '' }; return acc; }, {});
      setListInputs(initialInputs);
    } catch (err) {
      console.error("Error fetching OWNED NFTs:", err);
      setError("Could not fetch your NFTs. Check console.");
    } finally { setLoading(false); }
  }, [alchemy]);

  useEffect(() => {
    if (account && alchemy) {
      fetchOwnedNFTs(account);
    } else if (!account) {
      setOwnedNfts([]);
      setListInputs({});
    }
  }, [account, alchemy, fetchOwnedNFTs]);

  const handleListInputChange = (nftId, field, value) => {
    setListInputs(prevInputs => ({ ...prevInputs, [nftId]: { ...prevInputs[nftId], [field]: value } }));
  };

  return {
    ownedNfts,
    loading,
    error,
    listInputs,
    handleListInputChange,
    refreshOwnedNFTs: () => fetchOwnedNFTs(account)
  };
};