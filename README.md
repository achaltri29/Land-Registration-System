# 🏠 Blockchain Land Registry System

A complete end-to-end decentralized land/property registration and transfer system built on Ethereum blockchain with IPFS document storage and a modern React frontend.

## 🌟 Features

- **Property Registration**: Register land properties with document verification
- **Admin Verification**: Government authority approval system
- **Ownership Transfer**: Secure transfer between parties (seller → buyer)
- **Mortgages & Liens Management**: Place and clear liens on verified properties
- **Document Storage**: IPFS integration for decentralized document storage
- **Owner History**: Complete chronological ownership tracking
- **Event Logging**: Transparent blockchain event logging
- **Modern UI**: React frontend with MetaMask integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │ Ethereum Network│
│   (MetaMask)    │◄──►│   (Express)     │◄──►│  (Smart Contract)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   IPFS Network  │
                       │ (Document Storage)│
                       └─────────────────┘
```

## 📁 Project Structure

```
land-registry/
├── contracts/
│   └── LandRegistry.sol          # Main smart contract
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── LandRegistry.test.js      # Comprehensive test suite
├── backend/
│   ├── server.js                 # Express server
│   └── ipfs.js                   # IPFS utilities
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── App.tsx              # Main app component
│   │   └── App.css              # Styling
│   └── package.json
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Root dependencies
├── env.example                   # Environment variables template
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MetaMask browser extension
- Git

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd LandRegistrationSystem
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS= (will be set after deployment)
REACT_APP_CONTRACT_ADDRESS= (will be set after deployment)
```

### 3. Compile and Deploy Smart Contract

```bash
# Compile contracts
npx hardhat compile

# Start local blockchain
npx hardhat node

# In a new terminal, deploy contract
npx hardhat run --network localhost scripts/deploy.js
```

Copy the deployed contract address to your `.env` files:
- Root `.env` file: `CONTRACT_ADDRESS=0x...`
- Frontend `.env` file: `REACT_APP_CONTRACT_ADDRESS=0x...`

### 4. Start Backend Server

```bash
cd backend
node server.js
```

The backend will run on `http://localhost:3001`

### 5. Start Frontend

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

## 🧪 Testing

### Run Smart Contract Tests

```bash
npx hardhat test
```

### Test Coverage

```bash
npx hardhat coverage
```

## 📖 Usage Guide

### 1. Connect Wallet
- Open the application in your browser
- Click "Connect MetaMask" to connect your wallet
- Ensure you're connected to the correct network (localhost:8545)

### 2. Register Property
- Navigate to "Register Property" tab
- Fill in property details (location, area)
- Upload property documents (PDF, images, etc.)
- Click "Register Property"

### 3. Admin Verification
- If you're the contract owner (admin), go to "Admin Dashboard"
- Enter property ID to verify
- Click "Verify Property"

### 4. Transfer Ownership
- Go to "Transfer Ownership" tab
- **As Seller**: Initiate transfer with property ID and buyer address
- **As Buyer**: Confirm transfer with property ID

### 5. Search Property
- Use "Search Property" tab to view property details
- Enter property ID to see complete information and ownership history

### 6. Manage Mortgages & Liens
- **Place a Lien (Property Owner)**:
  - Navigate to "Mortgages & Liens" tab
  - Enter property ID (must be verified and owned by you)
  - Provide lender address, amount (in wei), and details/reference
  - Click "Place Lien" to secure the property with a mortgage/lien
  - Note: Properties with active liens cannot be transferred
  
- **Clear a Lien (Lender)**:
  - Navigate to "Mortgages & Liens" tab
  - Enter property ID with an active lien
  - Click "Clear Lien" (only the lender who placed the lien can clear it)
  - Once cleared, the property can be transferred again

## 🔧 Smart Contract Features

### Core Functions
- `registerProperty()` - Register new property
- `verifyProperty()` - Admin verification
- `initiateTransfer()` - Start ownership transfer
- `confirmTransfer()` - Complete transfer
- `updateDocumentHash()` - Update property documents
- `placeLien()` - Place a mortgage/lien on a verified property (owner only)
- `clearLien()` - Clear an active lien (lender only)
- `getLienInfo()` - Retrieve lien information for a property

### Events
- `PropertyRegistered` - New property registered
- `PropertyVerified` - Property verified by admin
- `TransferInitiated` - Transfer process started
- `TransferCompleted` - Ownership transferred
- `DocumentUpdated` - Documents updated
- `LienPlaced` - Lien/mortgage placed on property
- `LienCleared` - Lien/mortgage cleared from property

## 🌐 IPFS Integration

The system uses IPFS for decentralized document storage:

- Documents are uploaded to IPFS
- Only IPFS hashes are stored on blockchain
- Ensures documents are permanently available
- Reduces blockchain storage costs

## 🔒 Security Features

- **Access Control**: Only property owners can initiate transfers
- **Admin Verification**: Properties must be verified before transfer
- **Two-Step Transfer**: Initiate + Confirm process
- **Lien Protection**: Properties with active liens cannot be transferred
- **Lender Authorization**: Only the lender who placed a lien can clear it
- **Event Logging**: All actions are logged on blockchain
- **Document Integrity**: IPFS hashes ensure document authenticity

## 🏦 Mortgages & Liens System

The system includes a comprehensive mortgage and lien management feature that allows property owners to secure their properties with liens while protecting lenders' interests.

### How It Works

1. **Placing a Lien**:
   - Property must be verified by admin before a lien can be placed
   - Only the current property owner can place a lien
   - Owner specifies the lender address, amount (in wei), and details
   - Once placed, the property cannot be transferred until the lien is cleared

2. **Clearing a Lien**:
   - Only the lender who placed the lien can clear it
   - Typically done after loan payoff or mortgage satisfaction
   - Once cleared, the property becomes transferable again

3. **Transfer Restrictions**:
   - Properties with active liens cannot be transferred
   - This protects lenders by ensuring properties with outstanding debts cannot be sold without clearing the lien first
   - Both `initiateTransfer()` and `confirmTransfer()` check for active liens

### Use Cases

- **Mortgages**: Property owners can secure mortgages by placing liens on their properties
- **Debt Security**: Lenders can secure loans using property as collateral
- **Legal Liens**: Government or legal entities can place liens for tax or legal purposes
- **Transparency**: All lien information is publicly visible on the blockchain

### Technical Details

- Lien information is stored in the `Property` struct:
  - `lienActive`: Boolean flag indicating if a lien exists
  - `lienLender`: Address of the lender holding the lien
  - `lienAmount`: Amount secured by the lien (in wei)
  - `lienDetails`: Optional description or reference number

- The `noActiveLien` modifier prevents transfers when a lien is active
- All lien operations emit events for transparency and tracking

## 🛠️ Development

### Adding New Features

1. **Smart Contract**: Modify `contracts/LandRegistry.sol`
2. **Tests**: Update `test/LandRegistry.test.js`
3. **Backend**: Add routes in `backend/server.js`
4. **Frontend**: Create components in `frontend/src/components/`

### Deployment to Testnet

```bash
# Deploy to Sepolia testnet
npx hardhat run --network sepolia scripts/deploy.js

# Verify contract
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 📊 Gas Optimization

- Uses OpenZeppelin's `Ownable` for gas-efficient access control
- Events for logging instead of storage
- IPFS for large document storage
- Optimized Solidity compiler settings

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check network (should be localhost:8545)
   - Refresh the page

2. **Contract Not Deployed**
   - Check if local blockchain is running
   - Verify contract address in .env files
   - Redeploy contract

3. **IPFS Upload Failed**
   - Check IPFS configuration in .env
   - Ensure backend server is running
   - Verify IPFS credentials

4. **Transaction Failed**
   - Check if you have enough ETH for gas
   - Verify you're the property owner
   - Check if property is verified (for transfers)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenZeppelin for smart contract libraries
- Hardhat for development framework
- IPFS for decentralized storage
- React and ethers.js for frontend

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the smart contract documentation

---

**Built with ❤️ for the blockchain community**
