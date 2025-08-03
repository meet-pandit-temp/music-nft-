import React from "react";
import { Music, Tag, Hash, ShoppingCart, Star } from "lucide-react";
import { ethers } from "ethers";

// Import custom hooks
import { useAlchemy } from '../hooks/useAlchemy';
import { useWallet } from '../hooks/useWallet.js';
import { useOwnedNFTs } from '../hooks/useOwnedNFTs';
import { useNFTListing } from '../hooks/useNFTListing';
import { useMarketplaceNFTs } from '../hooks/useMarketplaceNFTs';
import { useNFTBuying } from '../hooks/useNFTBuying';

// Component definition
const SellNFT = () => {
  // Setup hooks
  const { alchemy, error: alchemyError } = useAlchemy();
  const { account, error: walletError, connectWallet } = useWallet();
  
  // NFT data hooks
  const { 
    ownedNfts, 
    loading: loadingOwned, 
    error: errorOwned,
    listInputs,
    handleListInputChange,
    refreshOwnedNFTs
  } = useOwnedNFTs(account, alchemy);
  
  const {
    marketNfts,
    loading: loadingMarket,
    error: errorMarket,
    buyInputs,
    handleBuyInputChange,
    refreshMarketNFTs
  } = useMarketplaceNFTs(account, alchemy);
  
  // Action hooks
  const { handleListNFT, listingError, isListing } = useNFTListing(
    account, 
    refreshOwnedNFTs, 
    refreshMarketNFTs
  );
  
  const { handleBuyNFT, buyingError, isBuying } = useNFTBuying(
    account,
    refreshOwnedNFTs,
    refreshMarketNFTs
  );

  // Determine general error
  const generalError = alchemyError;

  // Component Render
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      {/* Initial Config Error */}
      {generalError && (
        <div className="text-center bg-red-900 border border-red-700 p-4 rounded-lg mb-6">
          <p className="font-semibold text-lg">Configuration Error:</p>
          <p className="text-red-200">{generalError}</p>
        </div>
      )}

      {/* Wallet Connection */}
      {!account ? (
        <div className="text-center">
          <button 
            onClick={connectWallet} 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-50" 
            disabled={!!generalError}
          >
            Connect Wallet
          </button>
          {walletError && !generalError && <p className="text-red-400 mt-4">{walletError}</p>}
        </div>
      ) : (
        // --- Main Content When Connected ---
        <div>
          <p className="mb-6">Connected: <span className="font-mono bg-gray-700 px-2 py-1 rounded text-sm">{account}</span></p>

          {/* Section 1: Your NFTs (for Selling) */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">Your NFTs</h2>
            {loadingOwned && <p className="text-purple-300 text-center">Loading your NFTs...</p>}
            {errorOwned && !loadingOwned && !generalError && <p className="text-red-400 text-center mb-4">{errorOwned}</p>}
            {!loadingOwned && ownedNfts.length === 0 && !errorOwned && !generalError && (
              <p className="text-gray-400 text-center">You don't own any NFTs from this contract.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedNfts.map((nft) => (
                <div key={nft.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 flex flex-col">
                  <img src={nft.imageUrl} alt={nft.name} className="w-full h-48 object-cover bg-gray-700" onError={(e) => { e.target.src="/placeholder.png"; }}/>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-xl font-semibold mb-1 truncate" title={nft.name}>{nft.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">ID: {nft.tokenId} (Balance: {nft.balance})</p>
                    {/* Listing Inputs */}
                    <div className="space-y-3 mb-4 mt-auto pt-4 border-t border-gray-700">
                      {/* Price */}
                      <div className="flex items-center space-x-2">
                        <Tag size={18} className="text-purple-400 shrink-0"/>
                        <input 
                          type="number" 
                          value={listInputs[nft.id]?.price || ''} 
                          onChange={(e) => handleListInputChange(nft.id, 'price', e.target.value)} 
                          min="0" 
                          step="any" 
                          className="flex-1 p-1.5 border border-gray-600 rounded bg-gray-700 focus:ring-purple-500 placeholder-gray-500 text-sm" 
                          placeholder="Price" 
                          aria-label={`Price for ${nft.name}`}
                        />
                        <span className="text-gray-400 text-sm">ETH</span>
                      </div>
                      {/* Amount */}
                      <div className="flex items-center space-x-2">
                        <Hash size={18} className="text-blue-400 shrink-0"/>
                        <input 
                          type="number" 
                          value={listInputs[nft.id]?.amount || ''} 
                          onChange={(e) => handleListInputChange(nft.id, 'amount', e.target.value)} 
                          min="1" 
                          max={nft.balance} 
                          step="1" 
                          className="flex-1 p-1.5 border border-gray-600 rounded bg-gray-700 focus:ring-blue-500 placeholder-gray-500 text-sm" 
                          placeholder={`Amount (Max: ${nft.balance})`} 
                          aria-label={`Amount of ${nft.name} to list`}
                        />
                        <span className="text-gray-400 text-sm">QTY</span>
                      </div>
                    </div>
                    {/* List Button */}
                    <button 
                      onClick={() => handleListNFT(nft, listInputs[nft.id])} 
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded text-sm" 
                      disabled={
                        isListing || 
                        !listInputs[nft.id]?.price || 
                        parseFloat(listInputs[nft.id]?.price) <= 0 || 
                        !listInputs[nft.id]?.amount || 
                        parseInt(listInputs[nft.id]?.amount) <= 0 || 
                        parseInt(listInputs[nft.id]?.amount) > parseInt(nft.balance)
                      }
                    >
                      List for Sale
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Marketplace Listings (for Buying) */}
          <section>
            <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">Marketplace Listings</h2>
            {loadingMarket && <p className="text-purple-300 text-center">Loading marketplace listings...</p>}
            {errorMarket && !loadingMarket && !generalError && <p className="text-red-400 text-center mb-4">{errorMarket}</p>}
            {!loadingMarket && marketNfts.length === 0 && !errorMarket && !generalError && (
              <p className="text-gray-400 text-center">No NFTs currently listed for sale on the marketplace.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketNfts.map((listing) => (
                <div key={listing.listingId} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 flex flex-col">
                  <div className="relative">
                    <img src={listing.imageUrl} alt={listing.name} className="w-full h-48 object-cover bg-gray-700" onError={(e) => { e.target.src="/placeholder.png"; }}/>
                    {listing.isCreator && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <Star size={12} className="mr-1" />
                        Creator
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-xl font-semibold mb-1 truncate" title={listing.name}>{listing.name}</h3>
                    <p className="text-xs text-gray-500 mb-1 truncate" title={listing.seller}>
                      Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </p>
                    {listing.creator && (
                      <p className="text-xs text-gray-500 mb-1 truncate" title={listing.creator}>
                        Creator: {listing.creator.slice(0, 6)}...{listing.creator.slice(-4)}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 mb-1">ID: {listing.tokenId}</p>
                    <p className="text-md font-semibold text-purple-300 mb-2">{ethers.formatEther(listing.price)} ETH</p>
                    <p className="text-sm text-gray-400 mb-3">Available: {listing.availableAmount}</p>

                    {/* Show buy controls only if not the seller */}
                    {listing.seller.toLowerCase() !== account.toLowerCase() ? (
                      <>
                        {/* Buy Input */}
                        <div className="flex items-center space-x-2 mb-3 mt-auto pt-4 border-t border-gray-700">
                           <Hash size={18} className="text-green-400 shrink-0"/>
                           <input
                             type="number"
                             value={buyInputs[listing.listingId] || ''}
                             onChange={(e) => handleBuyInputChange(listing.listingId, e.target.value)}
                             min="1"
                             max={listing.availableAmount}
                             step="1"
                             className="flex-1 p-1.5 border border-gray-600 rounded bg-gray-700 focus:ring-green-500 placeholder-gray-500 text-sm"
                             placeholder={`Amount (Max: ${listing.availableAmount})`}
                             aria-label={`Amount of ${listing.name} to buy`}
                           />
                           <span className="text-gray-400 text-sm">QTY</span>
                         </div>

                        {/* Buy Button */}
                        <button
                          onClick={() => handleBuyNFT(listing, buyInputs[listing.listingId])}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded text-sm"
                          disabled={
                            isBuying ||
                            !buyInputs[listing.listingId] ||
                            parseInt(buyInputs[listing.listingId]) <= 0 ||
                            parseInt(buyInputs[listing.listingId]) > parseInt(listing.availableAmount)
                          }
                        >
                          <ShoppingCart size={16} className="inline mr-1" /> Buy Now
                        </button>
                      </>
                    ) : (
                      // Display message if it's the user's own listing
                      <div className="mt-auto pt-4 border-t border-gray-700">
                        <p className="text-center text-purple-400 text-sm font-semibold">This is your listing</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SellNFT;