import React, { useState } from 'react';
import { AppState } from '../types';

interface TransferOwnershipProps {
  appState: AppState;
}

const TransferOwnership: React.FC<TransferOwnershipProps> = ({ appState }) => {
  const [initiateForm, setInitiateForm] = useState({
    propertyId: '',
    buyerAddress: ''
  });
  const [confirmForm, setConfirmForm] = useState({
    propertyId: ''
  });
  const [cancelForm, setCancelForm] = useState({
    propertyId: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formSetter: React.Dispatch<React.SetStateAction<any>>) => {
    const { name, value } = e.target;
    formSetter((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Error: Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const tx = await appState.contract.initiateTransfer(
        initiateForm.propertyId,
        initiateForm.buyerAddress
      );

      await tx.wait();

      setMessage(`Transfer initiated successfully! Transaction: ${tx.hash}`);
      setInitiateForm({ propertyId: '', buyerAddress: '' });
    } catch (error: any) {
      const errorMessage = error?.reason || error.message || "An unknown error occurred.";
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Error: Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const tx = await appState.contract.confirmTransfer(confirmForm.propertyId);
      await tx.wait();

      setMessage(`Transfer completed successfully! Transaction: ${tx.hash}`);
      setConfirmForm({ propertyId: '' });
    } catch (error: any) {
      const errorMessage = error?.reason || error.message || "An unknown error occurred.";
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Error: Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const tx = await appState.contract.cancelTransfer(cancelForm.propertyId);
      await tx.wait();

      setMessage(`Transfer cancelled successfully! Transaction: ${tx.hash}`);
      setCancelForm({ propertyId: '' });
    } catch (error: any) {
      const errorMessage = error?.reason || error.message || "An unknown error occurred.";
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Transfer Property Ownership</h2>
      {message && (
        <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}
      <div className="card">
        <h3>Step 1: Initiate Transfer (Seller)</h3>
        <p>As the current property owner, you can initiate a transfer to a buyer's address.</p>
        
        <form onSubmit={handleInitiateTransfer}>
          <div className="form-group">
            <label htmlFor="initiatePropertyId">Property ID:</label>
            <input
              type="number"
              id="initiatePropertyId"
              name="propertyId"
              value={initiateForm.propertyId}
              onChange={(e) => handleInputChange(e, setInitiateForm)}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="buyerAddress">Buyer's Wallet Address:</label>
            <input
              type="text"
              id="buyerAddress"
              name="buyerAddress"
              value={initiateForm.buyerAddress}
              onChange={(e) => handleInputChange(e, setInitiateForm)}
              placeholder="0x..."
              required
            />
          </div>

          <button 
            type="submit" 
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Initiating...' : 'Initiate Transfer'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Step 2: Confirm Transfer (Buyer)</h3>
        <p>As the designated buyer, you must confirm the transfer to complete the process.</p>
        
        <form onSubmit={handleConfirmTransfer}>
          <div className="form-group">
            <label htmlFor="confirmPropertyId">Property ID:</label>
            <input
              type="number"
              id="confirmPropertyId"
              name="propertyId"
              value={confirmForm.propertyId}
              onChange={(e) => handleInputChange(e, setConfirmForm)}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <button 
            type="submit" 
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Confirming...' : 'Confirm Transfer'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Cancel Pending Transfer (Seller)</h3>
        <p>If you initiated a transfer in error, you can cancel it before the buyer confirms.</p>
        
        <form onSubmit={handleCancelTransfer}>
          <div className="form-group">
            <label htmlFor="cancelPropertyId">Property ID:</label>
            <input
              type="number"
              id="cancelPropertyId"
              name="propertyId"
              value={cancelForm.propertyId}
              onChange={(e) => handleInputChange(e, setCancelForm)}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <button 
            type="submit" 
            className="button button-danger"
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Transfer'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Transfer Process</h3>
        <ol style={{ paddingLeft: '20px', color: 'var(--text-light-color)', listStylePosition: 'inside' }}>
            <li><strong>Seller Initiates:</strong> Provides property ID and buyer's wallet address.</li>
            <li><strong>Buyer Confirms:</strong> Uses their wallet to confirm the transfer.</li>
            <li><strong>Ownership Transferred:</strong> The change is permanently recorded on the blockchain.</li>
            <li><strong>Note:</strong> Only verified properties can be transferred to ensure security.</li>
        </ol>
      </div>
    </div>
  );
};

export default TransferOwnership;

