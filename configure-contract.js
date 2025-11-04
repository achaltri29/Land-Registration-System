#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🏠 Blockchain Land Registry System - Contract Configuration\n');

rl.question('Enter your deployed contract address (0x...): ', (contractAddress) => {
  if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    console.log('❌ Invalid contract address format. Please enter a valid Ethereum address.');
    rl.close();
    return;
  }

  // Update root .env file
  const rootEnvContent = `# Contract Address
CONTRACT_ADDRESS=${contractAddress}

# Backend Configuration
PORT=3001
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_AUTH=your_infura_project_id:your_infura_project_secret`;

  // Update frontend .env file
  const frontendEnvContent = `REACT_APP_CONTRACT_ADDRESS=${contractAddress}
REACT_APP_API_URL=http://localhost:3001`;

  try {
    fs.writeFileSync('.env', rootEnvContent);
    fs.writeFileSync('frontend/.env', frontendEnvContent);
    
    console.log('\n✅ Contract address configured successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend: npm run backend');
    console.log('2. Start the frontend: npm run frontend');
    console.log('3. Open http://localhost:3000 in your browser');
    console.log('\n🎉 Your Land Registry System is ready to use!');
    
  } catch (error) {
    console.log('❌ Error writing configuration files:', error.message);
  }
  
  rl.close();
});
