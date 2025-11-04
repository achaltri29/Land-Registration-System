import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletConnection from './components/WalletConnection';
import RegisterProperty from './components/RegisterProperty';
import AdminDashboard from './components/AdminDashboard';
import TransferOwnership from './components/TransferOwnership';
import ManageLiens from './components/ManageLiens';
import SearchProperty from './components/SearchProperty';
import { ethers } from 'ethers';
import { AppState } from './types';

// Contract ABI (simplified for frontend)
const CONTRACT_ABI = [
  "function registerProperty(string memory _location, uint256 _area, string memory _ipfsDocHash) external",
  "function verifyProperty(uint256 _propertyId) external",
  "function updateDocumentHash(uint256 _propertyId, string memory _newIpfsDocHash) external",
  "function initiateTransfer(uint256 _propertyId, address _buyer) external",
  "function confirmTransfer(uint256 _propertyId) external",
  "function cancelTransfer(uint256 _propertyId) external",
  "function getProperty(uint256 _propertyId) external view returns (tuple(uint256 id, address currentOwner, string location, uint256 area, string ipfsDocHash, bool verified, address pendingBuyer))",
  "function getOwnersHistory(uint256 _propertyId) external view returns (tuple(address owner, uint256 timestamp, string action)[])",
  "function getUserProperties(address _user) external view returns (uint256[])",
  "function getTotalProperties() external view returns (uint256)",
  "function isPropertyVerified(uint256 _propertyId) external view returns (bool)",
  "function placeLien(uint256 _propertyId, address _lender, uint256 _amount, string _details) external",
  "function clearLien(uint256 _propertyId) external",
  "function getLienInfo(uint256 _propertyId) external view returns (bool active, address lender, uint256 amount, string details)",
  "function owner() external view returns (address)",
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string location, uint256 area, string ipfsDocHash)",
  "event PropertyVerified(uint256 indexed propertyId, address indexed verifier)",
  "event TransferInitiated(uint256 indexed propertyId, address indexed seller, address indexed buyer)",
  "event TransferCompleted(uint256 indexed propertyId, address indexed previousOwner, address indexed newOwner)",
  "event DocumentUpdated(uint256 indexed propertyId, address indexed owner, string newIpfsDocHash)",
  "event LienPlaced(uint256 indexed propertyId, address indexed owner, address indexed lender, uint256 amount, string details)",
  "event LienCleared(uint256 indexed propertyId, address indexed lender, address indexed owner)"
];

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';


function App() {
  const [appState, setAppState] = useState<AppState>({
    provider: null,
    signer: null,
    contract: null,
    readOnlyContract: null,
    account: null,
    isAdmin: false,
    isConnected: false,
    isLocalhost: false
  });

  const [activeTab, setActiveTab] = useState('register');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);


  const showAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 5000); // Hide after 5 seconds
  };

  const checkWalletConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  }, []);

  useEffect(() => {
    checkWalletConnection();
  }, [checkWalletConnection]);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        showAlert('Please install MetaMask!');
        return;
      }

      // Check if we're on the correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const sepoliaChainId = '0xaa36a7'; // Sepolia testnet chain ID
      const localhostChainId = '0x7a69'; // Localhost/Hardhat network chain ID (31337 in decimal)
      
      // Check if contract address is for localhost (typical Hardhat address pattern)
      const isLocalhostAddress = Boolean(CONTRACT_ADDRESS && (
        CONTRACT_ADDRESS.toLowerCase() === '0x5fbdb2315678afecb367f032d93f642f64180aa3' ||
        CONTRACT_ADDRESS.toLowerCase().startsWith('0x5fbd')
      ));

      // If using localhost contract, ensure we're on localhost network
      if (isLocalhostAddress && chainId !== localhostChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: localhostChainId }],
          });
          // Wait a bit for the network switch to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          // Refresh chainId after switch
          const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (newChainId !== localhostChainId) {
            showAlert('Please switch to localhost network in MetaMask and try again.');
            return;
          }
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: localhostChainId,
                  chainName: 'Hardhat Local',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  blockExplorerUrls: []
                }]
              });
              // Wait a bit for the network to be added
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (addError) {
              showAlert('Failed to add localhost network to MetaMask. Make sure Hardhat is running on port 8545.');
              return;
            }
          } else {
            showAlert('Failed to switch to localhost network. Make sure Hardhat is running on port 8545.');
            return;
          }
        }
      }
      
      // if (chainId !== sepoliaChainId) {
      //   try {
      //     await window.ethereum.request({
      //       method: 'wallet_switchEthereumChain',
      //       params: [{ chainId: sepoliaChainId }],
      //     });
      //   } catch (switchError: any) {
      //     // This error code indicates that the chain has not been added to MetaMask.
      //     if (switchError.code === 4902) {
      //       try {
      //         await window.ethereum.request({
      //           method: 'wallet_addEthereumChain',
      //           params: [{
      //             chainId: sepoliaChainId,
      //             chainName: 'Sepolia Test Network',
      //             rpcUrls: ['https://sepolia.infura.io/v3/'],
      //             nativeCurrency: {
      //               name: 'SepoliaETH',
      //               symbol: 'SepoliaETH',
      //               decimals: 18
      //             },
      //             blockExplorerUrls: ['https://sepolia.etherscan.io']
      //           }]
      //         });
      //       } catch (addError) {
      //         showAlert('Failed to add Sepolia network to MetaMask.');
      //         return;
      //       }
      //     } else {
      //       showAlert('Failed to switch to Sepolia network.');
      //       return;
      //     }
      //   }
      // }

      // For localhost, use MetaMask's signer but connect it to localhost provider
      // For other networks, use MetaMask's provider
      let provider: ethers.Provider;
      let signer: ethers.JsonRpcSigner | ethers.Signer;
      let accounts: string[];
      
      if (isLocalhostAddress) {
        // For localhost, we need MetaMask to sign but use localhost RPC
        // The solution: Use MetaMask's signer (for signing) but ensure MetaMask is on localhost network
        // MetaMask will use localhost RPC when on localhost network
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        accounts = await browserProvider.send('eth_requestAccounts', []);
        
        // Verify MetaMask is on localhost network
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== localhostChainId) {
          showAlert('Please switch MetaMask to localhost network (Hardhat Local)');
          return;
        }
        
        // Use MetaMask's provider and signer
        // When MetaMask is on localhost network, it should use localhost RPC
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        
        // Verify MetaMask is actually using localhost by checking the network
        try {
          const network = await provider.getNetwork();
          console.log('Connected network:', network);
          if (network.chainId !== BigInt(31337)) {
            console.warn('MetaMask might not be on localhost network');
          }
        } catch (e) {
          console.warn('Could not verify network:', e);
        }
      } else {
        // Use MetaMask's provider for non-localhost networks
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        provider = browserProvider;
        accounts = await browserProvider.send('eth_requestAccounts', []);
        signer = await browserProvider.getSigner();
      }
      
      if (!CONTRACT_ADDRESS) {
        showAlert('Contract address not configured!');
        return;
      }

      // Check if contract exists at this address before creating contract instance
      let isAdmin = false;
      try {
        // For localhost, use direct connection to check contract; for others use provider
        let checkProvider: ethers.Provider = provider;
        if (isLocalhostAddress) {
          try {
            checkProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
          } catch (e) {
            console.warn('Could not create direct localhost connection, using MetaMask provider');
          }
        }
        
        // Check if contract has code deployed
        const code = await checkProvider.getCode(CONTRACT_ADDRESS);
        if (code === '0x' || code === '0x0') {
          showAlert('No contract found at this address. Please deploy the contract first using: npx hardhat run scripts/deploy.js --network localhost');
          return;
        }
        
        // Create a read-only contract instance to check owner
        const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, checkProvider);
        const contractOwner = await readOnlyContract.owner();
        
        if (contractOwner && contractOwner !== ethers.ZeroAddress) {
          isAdmin = accounts[0].toLowerCase() === contractOwner.toLowerCase();
        } else {
          console.warn('Contract owner is zero address');
        }
      } catch (ownerError: any) {
        console.error('Error checking contract owner:', ownerError);
        if (ownerError.message && (ownerError.message.includes('could not decode') || ownerError.message.includes('BAD_DATA') || ownerError.message.includes('RPC endpoint'))) {
          if (isLocalhostAddress) {
            showAlert('Cannot connect to localhost. Make sure Hardhat is running: npx hardhat node');
          } else {
            showAlert('Contract not found at this address. Please deploy the contract first.');
          }
        } else {
          showAlert(`Contract error: ${ownerError.message || 'Unknown error'}. Please ensure the contract is deployed and Hardhat is running.`);
        }
        return;
      }

      // Create contract instance with signer for transactions
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Create read-only contract instance for view calls
      // For localhost, use direct localhost connection to avoid MetaMask RPC issues
      let readOnlyContract: ethers.Contract;
      if (isLocalhostAddress) {
        try {
          const readOnlyProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
          readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
        } catch (e) {
          // Fallback to main provider if direct connection fails
          readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        }
      } else {
        readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      }

      setAppState({
        provider,
        signer,
        contract,
        readOnlyContract,
        account: accounts[0],
        isAdmin,
        isConnected: true,
        isLocalhost: isLocalhostAddress
      });

      console.log('Wallet connected:', accounts[0]);
      console.log('Is admin:', isAdmin);
      console.log('Contract address:', CONTRACT_ADDRESS);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showAlert(`Failed to connect wallet: ${errorMessage}`);
    }
  };

  const disconnectWallet = () => {
    setAppState({
      provider: null,
      signer: null,
      contract: null,
      readOnlyContract: null,
      account: null,
      isAdmin: false,
      isConnected: false,
      isLocalhost: false
    });
    setActiveTab('register');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'register':
        return <RegisterProperty appState={appState} />;
      case 'admin':
        return <AdminDashboard appState={appState} />;
      case 'transfer':
        return <TransferOwnership appState={appState} />;
      case 'liens':
        return <ManageLiens appState={appState} />;
      case 'search':
        return <SearchProperty appState={appState} />;
      default:
        return <RegisterProperty appState={appState} />;
    }
  };

  return (
    <div className="App">
      {alertMessage && <div className="alert-popup">{alertMessage}</div>}
      <header className="App-header">
        <h1>🏠 Blockchain Land Registry System</h1>
        {appState.isConnected && (
            <WalletConnection 
                appState={appState}
                onConnect={connectWallet}
                onDisconnect={disconnectWallet}
            />
        )}
      </header>

      <main className="App-main">
        {appState.isConnected ? (
          <>
            <nav className="tab-navigation">
              <button 
                className={activeTab === 'register' ? 'active' : ''}
                onClick={() => setActiveTab('register')}
              >
                Register Property
              </button>
              <button 
                className={activeTab === 'search' ? 'active' : ''}
                onClick={() => setActiveTab('search')}
              >
                Search Property
              </button>
              <button 
                className={activeTab === 'transfer' ? 'active' : ''}
                onClick={() => setActiveTab('transfer')}
              >
                Transfer Ownership
              </button>
              <button 
                className={activeTab === 'liens' ? 'active' : ''}
                onClick={() => setActiveTab('liens')}
              >
                Mortgages & Liens
              </button>
              <button 
                className={activeTab === 'admin' ? 'active' : ''}
                onClick={() => setActiveTab('admin')}
                disabled={!appState.isAdmin}
              >
                Admin Dashboard
              </button>
            </nav>

            <div className="tab-content">
              {renderTabContent()}
            </div>
          </>
        ) : (
          <div className="welcome-message">
            <h2>Welcome to the Blockchain Land Registry System</h2>
            <p>Secure, transparent, and efficient property management. Connect your wallet to begin.</p>
            <button onClick={connectWallet} className="connect-button">
              Connect MetaMask
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

