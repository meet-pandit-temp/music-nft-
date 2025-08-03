// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract MusicNFTMarketplace is
    ERC1155,
    ERC2981,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    using Counters for Counters.Counter;
    using Strings for uint256;
    using Strings for address;

    Counters.Counter private _tokenIdCounter;

    event NFTPriceUpdated(uint256 indexed tokenId, uint256 newPrice);
    event NFTStatusUpdated(uint256 indexed tokenId, bool isActive);
    event BatchMintCompleted(
        address indexed buyer,
        uint256[] tokenIds,
        uint256[] amounts
    );
    event BatchListingCompleted(
        address indexed seller,
        uint256[] tokenIds,
        uint256[] amounts,
        uint256[] prices
    );
    event NFTCreated(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 price,
        uint256 maxSupply
    );
    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 amount
    );
    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 amount
    );
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event NFTMinted(address indexed minter, uint256 tokenId, uint256 amount);

    struct MusicNFT {
        uint256 tokenId; // Added tokenId
        address creator;
        string name;
        string description;
        string musicUrl;
        string imageUrl;
        uint256 price;
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 royaltyBPS;
        bool isActive;
    }

    struct Listing {
        address seller;
        uint256 price;
        uint256 amount;
    }

    struct NFTMetadata {
        string name;
        string description;
        string imageUrl;
        string musicUrl;
        address creator;
        uint256 price; // Added price
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 royaltyBPS;
        bool isActive; // Added isActive
    }

    mapping(uint256 => MusicNFT) public musicNFTs;
    mapping(uint256 => mapping(address => Listing)) public listings;
    mapping(uint256 => string) private _tokenNames;
    mapping(uint256 => string) private _tokenDescriptions;

    uint256 public constant MIN_ROYALTY_BPS = 0;
    uint256 public constant MAX_ROYALTY_BPS = 2500;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_BATCH_SIZE = 20;

    error InvalidAddress();
    error InvalidInput();
    error InvalidPrice();
    error InvalidRoyalty();
    error InvalidSupply();
    error InsufficientPayment();
    error InsufficientBalance();
    error TransferFailed();
    error NFTNotActive();
    error ArrayLengthMismatch();
    error BatchSizeTooLarge();
    error MaxSupplyExceeded();
    error NotAuthorized();
    error NFTNotFound();
    error Overflow(); // Add this line

    constructor() ERC1155("") Ownable() {
        if (msg.sender == address(0)) revert InvalidAddress();
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return
            super.supportsInterface(interfaceId) ||
            interfaceId == type(IERC2981).interfaceId;
    }

    function createMusicNFT(
        string calldata _name,
        string calldata _description,
        string calldata _musicUrl,
        string calldata _imageUrl,
        uint256 _price,
        uint256 _maxSupply,
        uint256 _royaltyBPS
    ) external whenNotPaused returns (uint256) {
        if (msg.sender == address(0)) revert InvalidAddress();
        if (
            bytes(_name).length == 0 ||
            bytes(_description).length == 0 ||
            bytes(_musicUrl).length == 0 ||
            bytes(_imageUrl).length == 0
        ) revert InvalidInput();
        if (_price == 0) revert InvalidPrice();
        if (_maxSupply == 0) revert InvalidSupply();
        if (_royaltyBPS > MAX_ROYALTY_BPS) revert InvalidRoyalty();

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        // ✅ Store new NFT details
        musicNFTs[newTokenId] = MusicNFT({
            tokenId: newTokenId, // Assign tokenId
            creator: msg.sender,
            name: _name,
            description: _description,
            musicUrl: _musicUrl,
            imageUrl: _imageUrl,
            price: _price,
            maxSupply: _maxSupply,
            currentSupply: 0,
            royaltyBPS: _royaltyBPS,
            isActive: true
        });

        // ✅ Store metadata separately
        _tokenNames[newTokenId] = _name;
        _tokenDescriptions[newTokenId] = _description;

        // ✅ Set token royalty
        _setTokenRoyalty(newTokenId, msg.sender, uint96(_royaltyBPS));

        // ✅ Emit Token ID as part of the event
        emit NFTCreated(newTokenId, msg.sender, _price, _maxSupply);

        return newTokenId; // Ensure token ID is returned
    }

    function getAllMusicNFTs() external view returns (MusicNFT[] memory) {
        uint256 totalNFTs = _tokenIdCounter.current();
        uint256 validNFTCount;

        // Count valid NFTs
        for (uint256 i = 1; i <= totalNFTs; i++) {
            if (musicNFTs[i].creator != address(0)) {
                validNFTCount++;
            }
        }

        // Allocate memory array for NFTs
        MusicNFT[] memory allNFTs = new MusicNFT[](validNFTCount);
        uint256 index = 0;

        // Populate array with valid NFTs
        for (uint256 i = 1; i <= totalNFTs; i++) {
            if (musicNFTs[i].creator != address(0)) {
                allNFTs[index] = musicNFTs[i]; // tokenId is already inside the struct
                index++;
            }
        }

        return allNFTs;
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                Listing storage listing = listings[ids[i]][from];
                if (listing.seller == from && listing.amount > 0) {
                    if (amounts[i] >= listing.amount) {
                        delete listings[ids[i]][from];
                        emit ListingCancelled(ids[i], from);
                    } else {
                        listing.amount -= amounts[i];
                        emit NFTListed(
                            ids[i],
                            from,
                            listing.price,
                            listing.amount
                        );
                    }
                }
            }
        }
    }

    function batchMintNFTs(
        uint256[] calldata _tokenIds, // Use uint256[] for token IDs
        uint256[] calldata _amounts // Use uint256[] for amounts
    ) external payable nonReentrant whenNotPaused {
        if (_tokenIds.length != _amounts.length) revert ArrayLengthMismatch();
        if (_tokenIds.length > MAX_BATCH_SIZE) revert BatchSizeTooLarge();

        uint256 totalCost;

        unchecked {
            for (uint256 i; i < _tokenIds.length; ++i) {
                MusicNFT storage nft = musicNFTs[_tokenIds[i]];
                if (!nft.isActive) revert NFTNotActive();
                if (_amounts[i] == 0) revert InvalidInput();
                if (nft.currentSupply + _amounts[i] > nft.maxSupply)
                    revert MaxSupplyExceeded();

                uint256 cost = nft.price * _amounts[i];
                totalCost += cost;

                (address royaltyReceiver, uint256 royalty) = royaltyInfo(
                    _tokenIds[i],
                    cost
                );
                uint256 payment = cost - royalty;

                nft.currentSupply += _amounts[i];

                if (royalty > 0) {
                    (bool successRoyalty, ) = payable(royaltyReceiver).call{
                        value: royalty
                    }("");
                    if (!successRoyalty) revert TransferFailed();
                }

                if (payment > 0) {
                    (bool successPayment, ) = payable(owner()).call{
                        value: payment
                    }("");
                    if (!successPayment) revert TransferFailed();
                }
            }
        }

        if (msg.value < totalCost) revert InsufficientPayment();

        _mintBatch(msg.sender, _tokenIds, _amounts, "");
        emit BatchMintCompleted(msg.sender, _tokenIds, _amounts);

        uint256 excess = msg.value - totalCost;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}(
                ""
            );
            if (!refundSuccess) revert TransferFailed();
        }
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        if (musicNFTs[tokenId].creator == address(0)) revert NFTNotFound();

        NFTMetadata memory metadata = getNFTMetadata(tokenId);

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        abi.encodePacked(
                            '{"name":"',
                            metadata.name,
                            '",',
                            '"description":"',
                            metadata.description,
                            '",',
                            '"image":"',
                            metadata.imageUrl,
                            '",',
                            '"animation_url":"',
                            metadata.musicUrl,
                            '",',
                            '"properties":{',
                            '"creator":"',
                            Strings.toHexString(uint160(metadata.creator), 20),
                            '",',
                            '"maxSupply":"',
                            metadata.maxSupply.toString(),
                            '",',
                            '"currentSupply":"',
                            metadata.currentSupply.toString(),
                            '",',
                            '"royaltyBPS":"',
                            metadata.royaltyBPS.toString(),
                            '"',
                            "}}"
                        )
                    )
                )
            );
    }

    function mintNFT(
        uint256 _tokenId,
        uint256 _amount
    ) external payable nonReentrant whenNotPaused {
        MusicNFT storage nft = musicNFTs[_tokenId];
        if (!nft.isActive) revert NFTNotActive();
        if (_amount == 0) revert InvalidInput();
        if (nft.currentSupply + _amount > nft.maxSupply)
            revert MaxSupplyExceeded();

        uint256 totalCost = nft.price * _amount;
        if (msg.value < totalCost) revert InsufficientPayment();

        nft.currentSupply += _amount;

        // During minting, send 100% to the artist (royalty receiver)
        (address royaltyReceiver, ) = royaltyInfo(_tokenId, totalCost);

        // Send full payment to artist (no platform cut)
        (bool success, ) = payable(royaltyReceiver).call{value: totalCost}("");
        if (!success) revert TransferFailed();

        // Refund excess ETH if user overpaid
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - totalCost
            }("");
            if (!refundSuccess) revert TransferFailed();
        }

        _mint(msg.sender, _tokenId, _amount, "");
        emit NFTMinted(msg.sender, _tokenId, _amount);
    }

    function updateNFTPrice(
        uint256 _tokenId,
        uint256 _newPrice
    ) external whenNotPaused {
        MusicNFT storage nft = musicNFTs[_tokenId];
        if (msg.sender != nft.creator && msg.sender != owner())
            revert NotAuthorized();
        if (_newPrice == 0) revert InvalidPrice();

        nft.price = _newPrice;
        emit NFTPriceUpdated(_tokenId, _newPrice);
    }

    function toggleNFTStatus(uint256 _tokenId) external whenNotPaused {
        MusicNFT storage nft = musicNFTs[_tokenId];
        if (msg.sender != nft.creator && msg.sender != owner())
            revert NotAuthorized();

        nft.isActive = !nft.isActive;
        emit NFTStatusUpdated(_tokenId, nft.isActive);
    }

    function listNFT(
        uint256 _tokenId,
        uint256 _amount,
        uint256 _price
    ) external nonReentrant whenNotPaused {
        if (balanceOf(msg.sender, _tokenId) < _amount)
            revert InsufficientBalance();
        if (_amount == 0) revert InvalidInput();
        if (_price == 0) revert InvalidPrice();
        if (!musicNFTs[_tokenId].isActive) revert NFTNotActive();

        // Ensure the listing is correctly stored in the mapping
        listings[_tokenId][msg.sender] = Listing({
            seller: msg.sender,
            price: _price,
            amount: _amount
        });

        emit NFTListed(_tokenId, msg.sender, _price, _amount);
    }

    function cancelListing(
        uint256 _tokenId
    ) external nonReentrant whenNotPaused {
        if (listings[_tokenId][msg.sender].seller != msg.sender)
            revert NotAuthorized();
        delete listings[_tokenId][msg.sender];
        emit ListingCancelled(_tokenId, msg.sender);
    }

    function buyListedNFT(
        uint256 _tokenId,
        address _seller,
        uint256 _amount
    ) external payable nonReentrant whenNotPaused {
        // Input validation
        if (_seller == address(0)) revert InvalidAddress();
        if (msg.sender == address(0)) revert InvalidAddress();
        if (_seller == msg.sender) revert NotAuthorized();

        Listing storage listing = listings[_tokenId][_seller];
        if (listing.seller != _seller) revert NotAuthorized();
        if (listing.amount < _amount) revert InsufficientBalance();
        if (!musicNFTs[_tokenId].isActive) revert NFTNotActive();

        // Ensure the seller has enough tokens to sell
        if (balanceOf(_seller, _tokenId) < _amount)
            revert InsufficientBalance();

        // Calculate total payment (use unchecked for multiplication)
        uint256 totalPayment;
        unchecked {
            totalPayment = listing.price * _amount;
        }

        // Ensure the buyer sent enough Ether
        if (msg.value < totalPayment) revert InsufficientPayment();

        // Calculate royalty and seller payment (use unchecked for subtraction)
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(
            _tokenId,
            totalPayment
        );
        uint256 sellerPayment;
        unchecked {
            sellerPayment = totalPayment - royaltyAmount;
        }

        // Transfer royalty to the royalty receiver
        if (royaltyAmount > 0) {
            (bool successRoyalty, ) = payable(royaltyReceiver).call{
                value: royaltyAmount
            }("");
            if (!successRoyalty) revert TransferFailed();
        }

        // Transfer payment to the seller
        (bool successPayment, ) = payable(_seller).call{value: sellerPayment}(
            ""
        );
        if (!successPayment) revert TransferFailed();

        // Transfer the NFT to the buyer
        _safeTransferFrom(_seller, msg.sender, _tokenId, _amount, "");

        // Update the listing
        unchecked {
            listing.amount -= _amount;
        }
        if (listing.amount == 0) {
            delete listings[_tokenId][_seller];
        }

        // Emit the NFTSold event with the correct price
        emit NFTSold(_tokenId, _seller, msg.sender, listing.price, _amount);

        // Refund excess Ether to the buyer
        if (msg.value > totalPayment) {
            unchecked {
                uint256 refundAmount = msg.value - totalPayment;
                (bool success, ) = payable(msg.sender).call{
                    value: refundAmount
                }("");
                if (!success) revert TransferFailed();
            }
        }
    }

    function getListing(
        uint256 _tokenId,
        address _seller
    ) external view returns (Listing memory) {
        return listings[_tokenId][_seller];
    }

    function getNFTMetadata(
        uint256 tokenId
    ) public view returns (NFTMetadata memory) {
        if (musicNFTs[tokenId].creator == address(0)) revert NFTNotFound();
        MusicNFT storage nft = musicNFTs[tokenId];

        (, uint256 royaltyBPS) = royaltyInfo(tokenId, BASIS_POINTS);

        return
            NFTMetadata({
                name: _tokenNames[tokenId],
                description: _tokenDescriptions[tokenId],
                imageUrl: nft.imageUrl,
                musicUrl: nft.musicUrl,
                creator: nft.creator,
                price: nft.price, // Added price
                maxSupply: nft.maxSupply,
                currentSupply: nft.currentSupply,
                royaltyBPS: royaltyBPS,
                isActive: nft.isActive // Added isActive
            });
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
