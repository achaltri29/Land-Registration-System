const hre = require("hardhat");

async function main() {
  console.log("Deploying LandRegistry contract...");

  // Get the contract factory
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");

  // Deploy the contract
  const landRegistry = await LandRegistry.deploy();

  // Wait for deployment to finish
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();

  console.log("LandRegistry deployed to:", contractAddress);
  console.log("Contract owner:", await landRegistry.owner());

  // Verify deployment on Etherscan if on a live network
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await landRegistry.deploymentTransaction().wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Save contract address to a file for frontend/backend use
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    './contract-address.json', 
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("Contract info saved to contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
