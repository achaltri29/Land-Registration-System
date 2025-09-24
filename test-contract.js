// Simple contract test script
// Run with: node test-contract.js

const { ethers } = require('ethers');

// Contract ABI (simplified)
const CONTRACT_ABI = [
  "function registerProperty(string memory _location, uint256 _area, string memory _ipfsDocHash) external",
  "function verifyProperty(uint256 _propertyId) external",
  "function getProperty(uint256 _propertyId) external view returns (tuple(uint256 id, address currentOwner, string location, uint256 area, string ipfsDocHash, bool verified, address pendingBuyer))",
  "function getTotalProperties() external view returns (uint256)",
  "function owner() external view returns (address)"
];

async function testContract() {
  try {
    console.log('🧪 Testing Land Registry Contract...\n');

    // Check if MetaMask is available
    if (typeof window.ethereum === 'undefined') {
      console.log('❌ MetaMask not found. Please install MetaMask and run this in a browser.');
      return;
    }

    // Connect to MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();

    console.log('✅ Connected to MetaMask');
    console.log('📍 Account:', accounts[0]);

    // You need to replace this with your deployed contract address
    const CONTRACT_ADDRESS = '0x_YOUR_CONTRACT_ADDRESS_HERE';
    
    if (CONTRACT_ADDRESS === '0x_YOUR_CONTRACT_ADDRESS_HERE') {
      console.log('❌ Please update CONTRACT_ADDRESS in this file with your deployed contract address');
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Test 1: Check contract owner
    console.log('\n🔍 Testing contract owner...');
    const owner = await contract.owner();
    console.log('✅ Contract owner:', owner);

    // Test 2: Check total properties
    console.log('\n🔍 Testing total properties...');
    const totalProperties = await contract.getTotalProperties();
    console.log('✅ Total properties:', totalProperties.toString());

    // Test 3: Register a test property
    console.log('\n🔍 Testing property registration...');
    const tx = await contract.registerProperty(
      '123 Test Street, Test City',
      '1000',
      'QmTestHash123'
    );
    
    console.log('⏳ Transaction sent:', tx.hash);
    await tx.wait();
    console.log('✅ Property registered successfully!');

    // Test 4: Get the registered property
    console.log('\n🔍 Testing property retrieval...');
    const property = await contract.getProperty(1);
    console.log('✅ Property details:');
    console.log('   ID:', property.id.toString());
    console.log('   Owner:', property.currentOwner);
    console.log('   Location:', property.location);
    console.log('   Area:', property.area.toString());
    console.log('   Verified:', property.verified);

    // Test 5: Verify property (if you're the owner)
    if (owner.toLowerCase() === accounts[0].toLowerCase()) {
      console.log('\n🔍 Testing property verification...');
      const verifyTx = await contract.verifyProperty(1);
      console.log('⏳ Verification transaction sent:', verifyTx.hash);
      await verifyTx.wait();
      console.log('✅ Property verified successfully!');
    } else {
      console.log('\n⚠️  Skipping verification test (not contract owner)');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update CONTRACT_ADDRESS in your .env files');
    console.log('2. Start the backend server: npm run backend');
    console.log('3. Start the frontend: npm run frontend');
    console.log('4. Open http://localhost:3000 in your browser');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MetaMask is connected');
    console.log('2. Check that you have the correct contract address');
    console.log('3. Ensure you have enough ETH for gas fees');
    console.log('4. Verify you\'re on the correct network');
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  testContract();
} else {
  // Node.js environment
  console.log('This script should be run in a browser with MetaMask installed.');
  console.log('Copy this code and run it in the browser console after deploying your contract.');
}
