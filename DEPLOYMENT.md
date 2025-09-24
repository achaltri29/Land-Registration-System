# 🚀 Deployment Guide

## Quick Start (Alternative Method)

Since Hardhat has Node.js version requirements, here's an alternative approach to get the system running:

### 1. Using Remix IDE (Recommended for Testing)

1. **Open Remix IDE**: Go to https://remix.ethereum.org
2. **Create New File**: Create `LandRegistry.sol` in the contracts folder
3. **Copy Contract Code**: Copy the contract code from `contracts/LandRegistry.sol`
4. **Install Dependencies**: 
   - Go to the File Manager
   - Click on the `@openzeppelin/contracts` package
   - Install version 5.0.0
5. **Compile**: Click the Compile tab and compile the contract
6. **Deploy**: 
   - Go to Deploy & Run tab
   - Select "Injected Provider - MetaMask"
   - Make sure you're on the correct network
   - Click Deploy
7. **Copy Contract Address**: Save the deployed contract address

### 2. Backend Setup

```bash
cd backend
npm install
node server.js
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 4. Environment Configuration

Create `.env` file in the root directory:
```env
CONTRACT_ADDRESS=0x_your_deployed_contract_address
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key_here
```

Create `.env` file in the frontend directory:
```env
REACT_APP_CONTRACT_ADDRESS=0x_your_deployed_contract_address
```

## Using Local Hardhat Network

If you have Node.js 20+ installed:

```bash
# Install dependencies
npm install

# Start local blockchain
npx hardhat node

# In another terminal, deploy contract
npx hardhat run --network localhost scripts/deploy.js

# Start backend
npm run backend

# Start frontend
npm run frontend
```

## Using Sepolia Testnet

1. **Get Testnet ETH**: Use a faucet like https://sepoliafaucet.com
2. **Configure Environment**:
   ```env
   RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=your_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```
3. **Deploy**:
   ```bash
   npx hardhat run --network sepolia scripts/deploy.js
   ```

## Troubleshooting

### Node.js Version Issues
- Upgrade to Node.js 20+ for full Hardhat support
- Or use Remix IDE as shown above

### MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Check network configuration
- Clear browser cache

### IPFS Issues
- Use Infura IPFS service
- Configure IPFS credentials in backend/.env
- Check IPFS service status

## System Architecture

```
Frontend (React) → Backend (Express) → Smart Contract (Ethereum)
                        ↓
                   IPFS (Documents)
```

## Features Implemented

✅ **Smart Contract Features**:
- Property registration with document verification
- Admin verification system
- Ownership transfer (initiate + confirm)
- Document hash storage on IPFS
- Owner history tracking
- Event logging for transparency

✅ **Backend Features**:
- Express.js server with CORS
- IPFS document upload/retrieval
- Admin verification endpoints
- Property query endpoints
- Health check endpoints

✅ **Frontend Features**:
- React with TypeScript
- MetaMask wallet integration
- Property registration form
- Admin dashboard
- Transfer ownership interface
- Property search and history
- Modern responsive UI

✅ **Security Features**:
- Access control with OpenZeppelin Ownable
- Two-step transfer process
- Document integrity via IPFS
- Event logging for audit trail

## Next Steps

1. **Deploy to Testnet**: Use Sepolia testnet for testing
2. **Add More Features**: 
   - Property search filters
   - Batch operations
   - Advanced admin controls
3. **UI Improvements**:
   - Property map integration
   - Document preview
   - Mobile optimization
4. **Security Enhancements**:
   - Multi-signature support
   - Time-locked transfers
   - KYC integration

## Support

For issues and questions:
- Check the troubleshooting section
- Review the smart contract code
- Test with Remix IDE first
- Use local development setup
