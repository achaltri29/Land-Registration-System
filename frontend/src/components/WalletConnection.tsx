import React from 'react';
import { AppState } from '../types';

interface WalletConnectionProps {
  appState: AppState;
  onConnect: () => void;
  onDisconnect: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ appState, onConnect, onDisconnect }) => {

  return (
    <div className="wallet-info">
      {appState.isConnected && appState.account ? (
        <div>
          <p>
            {appState.isAdmin && <span className="admin-badge">ADMIN</span>}
            <span className="address">{appState.account}</span>
          </p>
          <button onClick={onDisconnect} className="button button-danger" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <button onClick={onConnect} className="button button-primary">
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
