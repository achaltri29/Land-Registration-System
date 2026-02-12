// scripts/deploy.js
import pkg from "hardhat";
import dotenv from "dotenv";
import fs from "fs";

const { ethers, network, run } = pkg;

dotenv.config();

async function main() {
  console.log("🚀 Deploying LandRegistry contract...");

  // 1️⃣ Get the contract factory
  const LandRegistry = await ethers.getContractFactory("LandRegistry");

  // 2️⃣ Deploy the contract
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log(`✅ LandRegistry deployed to: ${contractAddress}`);
  console.log(`👤 Contract owner: ${await landRegistry.owner()}`);

  // 3️⃣ Verify on Etherscan (if not local)
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("⏳ Waiting for block confirmations before verifying...");
    await landRegistry.deploymentTransaction().wait(6);

    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("🔍 Contract verified on Etherscan ✅");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }

  // 4️⃣ Save contract info to JSON
  const contractInfo = {
    address: contractAddress,
    network: network.name,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("./contract-address.json", JSON.stringify(contractInfo, null, 2));
  console.log("📝 Contract info saved to contract-address.json");

  // 5️⃣ Optionally, update backend/.env CONTRACT_ADDRESS automatically
  const envPath = "./backend/.env";
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.match(/CONTRACT_ADDRESS=".*"/)) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=".*"/,
        `CONTRACT_ADDRESS="${contractAddress}"`
      );
      fs.writeFileSync(envPath, envContent);
      console.log("🔄 Updated CONTRACT_ADDRESS in backend/.env");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
