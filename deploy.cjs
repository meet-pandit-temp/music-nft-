const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("MusicNFTMarketplace");

  console.log("Deploying contract...");

  // Deploy the contract
  const contract = await Contract.deploy();
  await contract.waitForDeployment(); //  Correct way to wait for deployment in Ethers v6

  // Get the deployed contract address
  const contractAddress = await contract.getAddress();

  console.log("Contract deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

//address: 0x63406d65318404165cc7aBf857D882a6E4676278
