# 🎵 Music NFT Platform

A decentralized platform for artists to **tokenize and sell their music as NFTs**, built on the **ERC-1155 standard** and deployed on **Optimism Sepolia** for fast, low-cost transactions.

---

## 🌟 Features

- 🎼 **Mint Unique Music NFTs**  
  Artists can upload music tracks, cover art, and metadata to mint limited-edition NFTs.

- ⚡ **Optimism Sepolia Deployment**  
  Fast and affordable transactions using the Optimism Layer 2 network.

- 🧩 **ERC-1155 Token Standard**  
  Mint multiple music NFTs in a single contract, reducing gas fees by up to **80%**.

- 📁 **Decentralized Storage with IPFS + Pinata**  
  All files are securely stored and pinned on IPFS through Pinata for immutability.

- 🔁 **NFT Resale Marketplace**  
  Users can list and resell their owned music NFTs.

- 💰 **Royalty Distribution**  
  Artists receive a percentage of every resale, ensuring ongoing revenue.

- 🔐 **MetaMask Wallet Integration**  
  Secure wallet-based login and transaction signing.

- 🖼️ **Modern Marketplace UI**  
  Browse, buy, and sell music NFTs on a sleek interface built with **React** and **Tailwind CSS**.

---

## 🧱 Tech Stack

| Layer                  | Technologies                         |
| ---------------------- | ------------------------------------ |
| **Frontend**           | React, Vite, Tailwind CSS, Web3Modal |
| **Smart Contracts**    | Solidity, Hardhat, ERC-1155          |
| **Blockchain Network** | Optimism Sepolia (L2 Ethereum)       |
| **Storage**            | IPFS (via Pinata)                    |
| **APIs & Utils**       | Ethers.js, Axios                     |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/devanshdhruve/music-nft-ipd.git
cd music-nft-ipd
npm install
npm run dev
npx hardhat test test/MusicNFTMarketplace.test.cjs
npx hardhat run scripts/deploy.cjs --network optimismSepolia
```
