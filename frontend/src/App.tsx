import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletConnection from './components/WalletConnection';
import RegisterProperty from './components/RegisterProperty';
import AdminDashboard from './components/AdminDashboard';
import TransferOwnership from './components/TransferOwnership';
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
  "function owner() external view returns (address)",
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string location, uint256 area, string ipfsDocHash)",
  "event PropertyVerified(uint256 indexed propertyId, address indexed verifier)",
  "event TransferInitiated(uint256 indexed propertyId, address indexed seller, address indexed buyer)",
  "event TransferCompleted(uint256 indexed propertyId, address indexed previousOwner, address indexed newOwner)",
  "event DocumentUpdated(uint256 indexed propertyId, address indexed owner, string newIpfsDocHash)"
];

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';


function App() {
  const [appState, setAppState] = useState<AppState>({
    provider: null,
    signer: null,
    contract: null,
    account: null,
    isAdmin: false,
    isConnected: false
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

      // Check if we're on the correct network (Sepolia)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const sepoliaChainId = '0xaa36a7'; // Sepolia testnet chain ID
      
      if (chainId !== sepoliaChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: sepoliaChainId,
                  chainName: 'Sepolia Test Network',
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  nativeCurrency: {
                    name: 'SepoliaETH',
                    symbol: 'SepoliaETH',
                    decimals: 18
                  },
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
              });
            } catch (addError) {
              showAlert('Failed to add Sepolia network to MetaMask.');
              return;
            }
          } else {
            showAlert('Failed to switch to Sepolia network.');
            return;
          }
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      
      if (!CONTRACT_ADDRESS) {
        showAlert('Contract address not configured!');
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Check if current user is admin
      const contractOwner = await contract.owner();
      const isAdmin = accounts[0].toLowerCase() === contractOwner.toLowerCase();

      setAppState({
        provider,
        signer,
        contract,
        account: accounts[0],
        isAdmin,
        isConnected: true
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
      account: null,
      isAdmin: false,
      isConnected: false
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

