import React, { useState } from 'react';
import { AppState } from '../types';
import { waitForTransaction } from '../utils/transactionHelpers';
import { ethers } from 'ethers';

interface ManageLiensProps {
  appState: AppState;
}

const ManageLiens: React.FC<ManageLiensProps> = ({ appState }) => {
  const [propertyId, setPropertyId] = useState('');
  const [lender, setLender] = useState('');
  const [amount, setAmount] = useState('0');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceLien = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appState.contract || !appState.signer) {
      setMessage('Error: Please connect your wallet first');
      return;
    }
    if (!propertyId) {
      setMessage('Error: Property ID is required');
      return;
    }
    if (!ethers.isAddress(lender)) {
      setMessage('Error: Lender address is invalid');
      return;
    }
    let amountBn: bigint;
    try {
      amountBn = ethers.toBigInt(amount);
      if (amountBn < BigInt(0)) throw new Error('negative');
    } catch {
      setMessage('Error: Amount must be a non-negative integer (in wei)');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      // Preflight checks
      const readC = appState.readOnlyContract || appState.contract;
      const prop = await readC.getProperty(propertyId);
      if (!prop) throw new Error('Property not found');
      if (!appState.account || prop.currentOwner.toLowerCase() !== appState.account.toLowerCase()) {
        setMessage('Error: Only the current owner can place a lien');
        setLoading(false);
        return;
      }
      if (!prop.verified) {
        setMessage('Error: Property must be verified by admin before placing a lien');
        setLoading(false);
        return;
      }
      try {
        const lien = await readC.getLienInfo(propertyId);
        if (lien && lien[0]) {
          setMessage('Error: Lien already active on this property');
          setLoading(false);
          return;
        }
      } catch {}

      const tx = await appState.contract.placeLien(propertyId, lender, amountBn, details);
      await waitForTransaction(tx, appState.isLocalhost);
      setMessage(`Lien placed successfully. Tx: ${tx.hash}`);
    } catch (error: any) {
      const msg = error?.reason || error?.info?.error?.message || error?.message || 'Unknown error';
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLien = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appState.contract || !appState.signer) {
      setMessage('Error: Please connect your wallet first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const readC = appState.readOnlyContract || appState.contract;
      try {
        const lien = await readC.getLienInfo(propertyId);
        if (!lien || !lien[0]) {
          setMessage('Error: No active lien on this property');
          setLoading(false);
          return;
        }
        if (lien[1] && appState.account && lien[1].toLowerCase() !== appState.account.toLowerCase()) {
          setMessage('Error: Only the lender can clear the lien');
          setLoading(false);
          return;
        }
      } catch {}

      const tx = await appState.contract.clearLien(propertyId);
      await waitForTransaction(tx, appState.isLocalhost);
      setMessage(`Lien cleared successfully. Tx: ${tx.hash}`);
    } catch (error: any) {
      const msg = error?.reason || error?.info?.error?.message || error?.message || 'Unknown error';
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Manage Mortgages & Liens</h2>
      <div className="card">
        <h3>Place Lien (Owner)</h3>
        <form onSubmit={handlePlaceLien}>
          <div className="form-group">
            <label>Property ID</label>
            <input type="number" min="1" required value={propertyId} onChange={e => setPropertyId(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Lender Address</label>
            <input type="text" required value={lender} onChange={e => setLender(e.target.value)} placeholder="0x..." />
          </div>
          <div className="form-group">
            <label>Amount (wei)</label>
            <input type="number" min="0" required value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Details / Reference</label>
            <input type="text" value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g., Loan #123" />
          </div>
          <button type="submit" className="button button-primary" disabled={loading || !propertyId || !lender}> {loading ? 'Submitting...' : 'Place Lien'} </button>
        </form>
      </div>

      <div className="card">
        <h3>Clear Lien (Lender)</h3>
        <form onSubmit={handleClearLien}>
          <div className="form-group">
            <label>Property ID</label>
            <input type="number" min="1" required value={propertyId} onChange={e => setPropertyId(e.target.value)} />
          </div>
          <button type="submit" className="button button-danger" disabled={loading || !propertyId}> {loading ? 'Submitting...' : 'Clear Lien'} </button>
        </form>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>{message}</div>
      )}
    </div>
  );
};

export default ManageLiens;



