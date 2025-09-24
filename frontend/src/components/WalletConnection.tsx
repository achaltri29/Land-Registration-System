import React from 'react';
import { AppState } from '../types';

interface WalletConnectionProps {
  appState: AppState;
  onConnect: () => void;
  onDisconnect: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ appState, onConnect, onDisconnect }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-info">
      {appState.isConnected ? (
        <div>
          <p><strong>Connected:</strong> {appState.account && formatAddress(appState.account)}</p>
          {appState.isAdmin && <span className="admin-badge">ADMIN</span>}
          <button onClick={onDisconnect} className="submit-button" style={{ marginTop: '10px' }}>
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <p>Wallet not connected</p>
          <button onClick={onConnect} className="submit-button">
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
