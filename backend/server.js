const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { uploadBase64ToIPFS, isIPFSConnected } = require('./ipfs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/';

if (!CONTRACT_ADDRESS) {
  console.error('CONTRACT_ADDRESS not found in environment variables');
  process.exit(1);
}

// Contract ABI (simplified version for backend operations)
const CONTRACT_ABI = [
  "function verifyProperty(uint256 _propertyId) external",
  "function getProperty(uint256 _propertyId) external view returns (tuple(uint256 id, address currentOwner, string location, uint256 area, string ipfsDocHash, bool verified, address pendingBuyer))",
  "function getTotalProperties() external view returns (uint256)",
  "function isPropertyVerified(uint256 _propertyId) external view returns (bool)",
  "event PropertyVerified(uint256 indexed propertyId, address indexed verifier)"
];

// Initialize provider (no wallet needed for read operations)
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const ipfsStatus = await isIPFSConnected();
    const contractStatus = await contract.getTotalProperties();
    
    res.json({
      status: 'healthy',
      ipfs: ipfsStatus ? 'connected' : 'disconnected',
      contract: 'connected',
      totalProperties: contractStatus.toString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Upload document to IPFS
app.post('/upload-doc', async (req, res) => {
  try {
    const { fileData, filename } = req.body;
    
    if (!fileData || !filename) {
      return res.status(400).json({
        success: false,
        error: 'fileData and filename are required'
      });
    }

    // Upload to IPFS
    const ipfsHash = await uploadBase64ToIPFS(fileData, filename);
    
    res.json({
      success: true,
      ipfsHash,
      message: 'Document uploaded successfully to IPFS'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint to verify property (read-only for now)
app.post('/admin/verify', async (req, res) => {
  try {
    const { propertyId } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'propertyId is required'
      });
    }

    // Check if property exists and is not already verified
    const property = await contract.getProperty(propertyId);
    if (property.verified) {
      return res.status(400).json({
        success: false,
        error: 'Property is already verified'
      });
    }

    // For now, just return success (admin verification should be done via frontend)
    res.json({
      success: true,
      message: 'Property verification should be done via frontend with MetaMask'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get property details
app.get('/property/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    const property = await contract.getProperty(propertyId);
    
    res.json({
      success: true,
      property: {
        id: property.id.toString(),
        currentOwner: property.currentOwner,
        location: property.location,
        area: property.area.toString(),
        ipfsDocHash: property.ipfsDocHash,
        verified: property.verified,
        pendingBuyer: property.pendingBuyer
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get total properties count
app.get('/properties/count', async (req, res) => {
  try {
    const count = await contract.getTotalProperties();
    
    res.json({
      success: true,
      count: count.toString()
    });
  } catch (error) {
    console.error('Get count error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check if property is verified
app.get('/property/:id/verified', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    const isVerified = await contract.isPropertyVerified(propertyId);
    
    res.json({
      success: true,
      verified: isVerified
    });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Contract address: ${CONTRACT_ADDRESS}`);
  console.log(`RPC URL: ${RPC_URL}`);
  
  // Check IPFS connection
  const ipfsConnected = await isIPFSConnected();
  console.log(`IPFS status: ${ipfsConnected ? 'Connected' : 'Disconnected'}`);
  
  if (!ipfsConnected) {
    console.warn('Warning: IPFS is not connected. Document uploads will fail.');
  }
});

module.exports = app;
