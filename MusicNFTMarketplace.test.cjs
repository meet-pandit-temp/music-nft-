const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MusicNFTMarketplace", function () {
  async function deployMarketplaceFixture() {
    const [owner, creator, buyer] = await ethers.getSigners();
    const MusicNFTMarketplace = await ethers.getContractFactory(
      "MusicNFTMarketplace"
    );
    const marketplace = await MusicNFTMarketplace.deploy();
    await marketplace.waitForDeployment();

    return { marketplace, owner, creator, buyer };
  }

  describe("NFT Creation", function () {
    it("Should create a new music NFT", async function () {
      const { marketplace, creator } = await loadFixture(
        deployMarketplaceFixture
      );

      const name = "Test Song";
      const description = "A test song";
      const musicUrl = "https://example.com/song.mp3";
      const imageUrl = "https://example.com/cover.jpg";
      const price = ethers.parseEther("0.1");
      const maxSupply = 100;
      const royaltyBPS = 1000; // 10%

      // Expect NFTCreated event with correct args
      await expect(
        marketplace
          .connect(creator)
          .createMusicNFT(
            name,
            description,
            musicUrl,
            imageUrl,
            price,
            maxSupply,
            royaltyBPS
          )
      )
        .to.emit(marketplace, "NFTCreated")
        .withArgs(1, creator.address, price, maxSupply); // Validate emitted values

      const tokenId = 1; // First token
      const nft = await marketplace.musicNFTs(tokenId);

      // Validate all struct properties, including tokenId
      expect(nft.tokenId).to.equal(tokenId); // New check for tokenId
      expect(nft.creator).to.equal(creator.address);
      expect(nft.name).to.equal(name);
      expect(nft.description).to.equal(description);
      expect(nft.musicUrl).to.equal(musicUrl);
      expect(nft.imageUrl).to.equal(imageUrl);
      expect(nft.price).to.equal(price);
      expect(nft.maxSupply).to.equal(maxSupply);
      expect(nft.currentSupply).to.equal(0);
      expect(nft.royaltyBPS).to.equal(royaltyBPS);
      expect(nft.isActive).to.be.true;
    });
  });

  describe("Fetching All NFT Collections", function () {
    it("Should retrieve all created music NFT collections correctly", async function () {
      const { marketplace, creator } = await loadFixture(
        deployMarketplaceFixture
      );

      // Create multiple NFT collections
      await expect(
        marketplace.connect(creator).createMusicNFT(
          "Song 1",
          "First NFT Song",
          "ipfs://music1",
          "ipfs://image1",
          ethers.parseEther("0.1"),
          100,
          500 // 5% royalty
        )
      )
        .to.emit(marketplace, "NFTCreated")
        .withArgs(1, creator.address, ethers.parseEther("0.1"), 100);

      await expect(
        marketplace.connect(creator).createMusicNFT(
          "Song 2",
          "Second NFT Song",
          "ipfs://music2",
          "ipfs://image2",
          ethers.parseEther("0.2"),
          50,
          1000 // 10% royalty
        )
      )
        .to.emit(marketplace, "NFTCreated")
        .withArgs(2, creator.address, ethers.parseEther("0.2"), 50);

      // ✅ Fetch all NFT collections
      const collections = await marketplace.getAllMusicNFTs();

      // ✅ Ensure the function returns exactly 2 NFTs
      expect(collections).to.have.lengthOf(2);

      // ✅ Validate the first NFT (Token ID 1)
      const nft1 = collections[0];
      expect(nft1.tokenId).to.equal(1); // Check tokenId
      expect(nft1.creator).to.equal(creator.address);
      expect(nft1.name).to.equal("Song 1");
      expect(nft1.description).to.equal("First NFT Song");
      expect(nft1.musicUrl).to.equal("ipfs://music1");
      expect(nft1.imageUrl).to.equal("ipfs://image1");
      expect(nft1.price).to.equal(ethers.parseEther("0.1"));
      expect(nft1.maxSupply).to.equal(100);
      expect(nft1.currentSupply).to.equal(0);
      expect(nft1.royaltyBPS).to.equal(500);
      expect(nft1.isActive).to.be.true;

      // ✅ Validate the second NFT (Token ID 2)
      const nft2 = collections[1];
      expect(nft2.tokenId).to.equal(2); // Check tokenId
      expect(nft2.creator).to.equal(creator.address);
      expect(nft2.name).to.equal("Song 2");
      expect(nft2.description).to.equal("Second NFT Song");
      expect(nft2.musicUrl).to.equal("ipfs://music2");
      expect(nft2.imageUrl).to.equal("ipfs://image2");
      expect(nft2.price).to.equal(ethers.parseEther("0.2"));
      expect(nft2.maxSupply).to.equal(50);
      expect(nft2.currentSupply).to.equal(0);
      expect(nft2.royaltyBPS).to.equal(1000);
      expect(nft2.isActive).to.be.true;
    });
  });

  describe("NFT Minting", function () {
    it("Should mint a music NFT", async function () {
      const { marketplace, creator, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      // Create NFT first
      await marketplace
        .connect(creator)
        .createMusicNFT(
          "Test Song",
          "A test song",
          "https://example.com/song.mp3",
          "https://example.com/cover.jpg",
          ethers.parseEther("0.1"),
          100,
          1000
        );

      const tokenId = 1;
      const amount = 1;
      const price = ethers.parseEther("0.1");

      await expect(
        marketplace.connect(buyer).mintNFT(tokenId, amount, {
          value: price,
        })
      )
        .to.emit(marketplace, "TransferSingle")
        .withArgs(
          buyer.address,
          ethers.ZeroAddress,
          buyer.address,
          tokenId,
          amount
        );

      expect(await marketplace.balanceOf(buyer.address, tokenId)).to.equal(
        amount
      );
    });
  });

  describe("NFT Listing", function () {
    it("Should list an NFT for sale", async function () {
      const { marketplace, creator, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      // Create and mint NFT first
      await marketplace
        .connect(creator)
        .createMusicNFT(
          "Test Song",
          "A test song",
          "https://example.com/song.mp3",
          "https://example.com/cover.jpg",
          ethers.parseEther("0.1"),
          100,
          1000
        );

      const tokenId = 1;
      const amount = 1;
      const mintPrice = ethers.parseEther("0.1");
      const listPrice = ethers.parseEther("0.2");

      await marketplace.connect(buyer).mintNFT(tokenId, amount, {
        value: mintPrice,
      });

      await expect(
        marketplace.connect(buyer).listNFT(tokenId, amount, listPrice)
      )
        .to.emit(marketplace, "NFTListed")
        .withArgs(tokenId, buyer.address, listPrice, amount);

      const listing = await marketplace.getListing(tokenId, buyer.address);
      expect(listing.seller).to.equal(buyer.address);
      expect(listing.price).to.equal(listPrice);
      expect(listing.amount).to.equal(amount);
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const { marketplace, creator, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      // Create multiple NFTs first
      await marketplace
        .connect(creator)
        .createMusicNFT(
          "Test Song 1",
          "A test song",
          "https://example.com/song1.mp3",
          "https://example.com/cover1.jpg",
          ethers.parseEther("0.1"),
          100,
          1000
        );

      await marketplace
        .connect(creator)
        .createMusicNFT(
          "Test Song 2",
          "A test song",
          "https://example.com/song2.mp3",
          "https://example.com/cover2.jpg",
          ethers.parseEther("0.2"),
          100,
          1000
        );

      const tokenIds = [1, 2];
      const amounts = [2, 3];
      const totalCost = ethers.parseEther("0.8"); // (0.1 * 2) + (0.2 * 3)

      await expect(
        marketplace.connect(buyer).batchMintNFTs(tokenIds, amounts, {
          value: totalCost,
        })
      )
        .to.emit(marketplace, "BatchMintCompleted")
        .withArgs(buyer.address, tokenIds, amounts);

      expect(await marketplace.balanceOf(buyer.address, 1)).to.equal(2);
      expect(await marketplace.balanceOf(buyer.address, 2)).to.equal(3);
    });
  });

  describe("NFT Price Update", function () {
    it("Should update the price of an NFT", async function () {
      const { marketplace, creator } = await loadFixture(
        deployMarketplaceFixture
      );

      await marketplace
        .connect(creator)
        .createMusicNFT(
          "Test Song",
          "A test song",
          "https://example.com/song.mp3",
          "https://example.com/cover.jpg",
          ethers.parseEther("0.1"),
          100,
          1000
        );

      const newPrice = ethers.parseEther("0.2");
      await expect(marketplace.connect(creator).updateNFTPrice(1, newPrice))
        .to.emit(marketplace, "NFTPriceUpdated")
        .withArgs(1, newPrice);

      const nft = await marketplace.musicNFTs(1);
      expect(nft.price).to.equal(newPrice);
    });
  });

  describe("NFT Status Toggle", function () {
    it("Should toggle the status of an NFT", async function () {
      const { marketplace, creator } = await loadFixture(
        deployMarketplaceFixture
      );

      await marketplace
        .connect(creator)
        .createMusicNFT(
          "Test Song",
          "A test song",
          "https://example.com/song.mp3",
          "https://example.com/cover.jpg",
          ethers.parseEther("0.1"),
          100,
          1000
        );

      await expect(marketplace.connect(creator).toggleNFTStatus(1))
        .to.emit(marketplace, "NFTStatusUpdated")
        .withArgs(1, false);

      const nft = await marketplace.musicNFTs(1);
      expect(nft.isActive).to.be.false;
    });
  });

  describe("Listing Cancellation", function () {
    it("Should cancel a listing", async function () {
      const { marketplace, creator, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      await marketplace
        .connect(creator)
        .createMusicNFT(
          "Test Song",
          "A test song",
          "https://example.com/song.mp3",
          "https://example.com/cover.jpg",
          ethers.parseEther("0.1"),
          100,
          1000
        );

      const tokenId = 1;
      const amount = 1;
      const listPrice = ethers.parseEther("0.2");

      // Ensure the buyer has enough Ether to list the NFT
      await marketplace.connect(creator).mintNFT(tokenId, amount, {
        value: ethers.parseEther("0.1"),
      });

      await marketplace.connect(creator).listNFT(tokenId, amount, listPrice);

      await expect(marketplace.connect(creator).cancelListing(tokenId))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(tokenId, creator.address);

      const listing = await marketplace.getListing(tokenId, creator.address);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
    });
  });

  it("Should buy a listed NFT", async function () {
    const { marketplace, creator, buyer } = await loadFixture(
      deployMarketplaceFixture
    );

    // Create and list an NFT
    await marketplace.connect(creator).createMusicNFT(
      "Test Song",
      "A test song",
      "https://example.com/song.mp3",
      "https://example.com/cover.jpg",
      ethers.parseEther("0.1"), // Original NFT price
      100,
      1000
    );

    const tokenId = 1;
    const amount = 1;
    const listPrice = ethers.parseEther("0.2");

    // Mint the NFT and list it for sale
    await marketplace.connect(creator).mintNFT(tokenId, amount, {
      value: ethers.parseEther("0.1"),
    });

    // List the NFT
    await marketplace.connect(creator).listNFT(tokenId, amount, listPrice);

    // Log the listing details before buying
    const listingBefore = await marketplace.getListing(
      tokenId,
      creator.address
    );
    console.log("Listing price before:", listingBefore.price.toString());

    // Buyer buys the listed NFT
    const tx = await marketplace
      .connect(buyer)
      .buyListedNFT(tokenId, creator.address, amount, {
        value: listPrice,
      });

    // Wait for the transaction and get the receipt
    const receipt = await tx.wait();

    // Find the NFTSold event
    const nftSoldEvent = receipt.logs.find(
      (log) => log.eventName === "NFTSold"
    );

    // Log the event arguments for debugging
    console.log("NFTSold Event Arguments:", nftSoldEvent.args);

    // Verify the buyer now owns the NFT
    expect(await marketplace.balanceOf(buyer.address, tokenId)).to.equal(
      amount
    );
  });
  describe("Pause and Unpause", function () {
    it("Should pause and unpause the contract", async function () {
      const { marketplace, owner } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(marketplace.connect(owner).pause())
        .to.emit(marketplace, "Paused")
        .withArgs(owner.address);

      await expect(marketplace.connect(owner).unpause())
        .to.emit(marketplace, "Unpaused")
        .withArgs(owner.address);
    });
  });

  describe("NFT Metadata", function () {
    it("Should return the correct metadata for an NFT", async function () {
      const { marketplace, creator } = await loadFixture(
        deployMarketplaceFixture
      );

      const name = "Test Song";
      const description = "A test song";
      const musicUrl = "https://example.com/song.mp3";
      const imageUrl = "https://example.com/cover.jpg";
      const price = ethers.parseEther("0.1");
      const maxSupply = 100;
      const royaltyBPS = 1000; // 10%

      // ✅ Create NFT
      await marketplace
        .connect(creator)
        .createMusicNFT(
          name,
          description,
          musicUrl,
          imageUrl,
          price,
          maxSupply,
          royaltyBPS
        );

      const tokenId = 1;
      const metadata = await marketplace.getNFTMetadata(tokenId);

      // ✅ Validate all metadata fields
      expect(metadata.name).to.equal(name);
      expect(metadata.description).to.equal(description);
      expect(metadata.musicUrl).to.equal(musicUrl);
      expect(metadata.imageUrl).to.equal(imageUrl);
      expect(metadata.creator).to.equal(creator.address);
      expect(metadata.price).to.equal(price); // Added price validation
      expect(metadata.maxSupply).to.equal(maxSupply);
      expect(metadata.currentSupply).to.equal(0);
      expect(metadata.royaltyBPS).to.equal(royaltyBPS);
      expect(metadata.isActive).to.be.true; // Added isActive validation
    });
  });
});
