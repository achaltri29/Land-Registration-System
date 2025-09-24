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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInitiateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInitiateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfirmForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Please connect your wallet first');
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
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Guard: only the pending buyer can confirm the transfer
      const property = await appState.contract.getProperty(confirmForm.propertyId);
      const pendingBuyer: string = property.pendingBuyer;
      const activeAccount = (appState.account || '').toLowerCase();
      if (!pendingBuyer || pendingBuyer.toLowerCase() === '0x0000000000000000000000000000000000000000') {
        setMessage('Error: No pending transfer found for this property');
        setLoading(false);
        return;
      }
      if (pendingBuyer.toLowerCase() !== activeAccount) {
        setMessage(`Error: Switch to the buyer account (${pendingBuyer.slice(0,6)}...${pendingBuyer.slice(-4)}) to confirm`);
        setLoading(false);
        return;
      }

      const tx = await appState.contract.confirmTransfer(confirmForm.propertyId);
      await tx.wait();

      setMessage(`Transfer completed successfully! Transaction: ${tx.hash}`);
      setConfirmForm({ propertyId: '' });
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const tx = await appState.contract.cancelTransfer(confirmForm.propertyId);
      await tx.wait();

      setMessage(`Transfer cancelled successfully! Transaction: ${tx.hash}`);
      setConfirmForm({ propertyId: '' });
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Transfer Property Ownership</h2>
      
      <div className="property-card">
        <h3>Initiate Transfer (Seller)</h3>
        <p>As a property owner, you can initiate a transfer to a buyer.</p>
        
        <form onSubmit={handleInitiateTransfer}>
          <div className="form-group">
            <label htmlFor="initiatePropertyId">Property ID:</label>
            <input
              type="number"
              id="initiatePropertyId"
              name="propertyId"
              value={initiateForm.propertyId}
              onChange={handleInitiateChange}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="buyerAddress">Buyer Address:</label>
            <input
              type="text"
              id="buyerAddress"
              name="buyerAddress"
              value={initiateForm.buyerAddress}
              onChange={handleInitiateChange}
              placeholder="0x..."
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Initiating...' : 'Initiate Transfer'}
          </button>
        </form>
      </div>

      <div className="property-card">
        <h3>Confirm Transfer (Buyer)</h3>
        <p>As a buyer, you can confirm a transfer initiated by the seller.</p>
        
        <form onSubmit={handleConfirmTransfer}>
          <div className="form-group">
            <label htmlFor="confirmPropertyId">Property ID:</label>
            <input
              type="number"
              id="confirmPropertyId"
              name="propertyId"
              value={confirmForm.propertyId}
              onChange={handleConfirmChange}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Confirming...' : 'Confirm Transfer'}
          </button>
        </form>
      </div>

      <div className="property-card">
        <h3>Cancel Transfer (Seller)</h3>
        <p>As a seller, you can cancel a transfer you initiated.</p>
        
        <form onSubmit={handleCancelTransfer}>
          <div className="form-group">
            <label htmlFor="cancelPropertyId">Property ID:</label>
            <input
              type="number"
              id="cancelPropertyId"
              name="propertyId"
              value={confirmForm.propertyId}
              onChange={handleConfirmChange}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
            style={{ background: 'linear-gradient(45deg, #ef5350, #e53935)' }}
          >
            {loading ? 'Cancelling...' : 'Cancel Transfer'}
          </button>
        </form>
      </div>

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <div className="property-card">
        <h3>Transfer Process</h3>
        <ol style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.8)' }}>
          <li><strong>Step 1:</strong> Seller initiates transfer by providing property ID and buyer address</li>
          <li><strong>Step 2:</strong> Buyer confirms the transfer using the same property ID</li>
          <li><strong>Step 3:</strong> Ownership is transferred and recorded on the blockchain</li>
          <li><strong>Note:</strong> Only verified properties can be transferred</li>
        </ol>
      </div>
    </div>
  );
};

export default TransferOwnership;
