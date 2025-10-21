import React, { useState, useEffect, useCallback } from 'react';
import { AppState } from '../types';

interface AdminDashboardProps {
  appState: AppState;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ appState }) => {
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [totalProperties, setTotalProperties] = useState(0);

  const fetchTotalProperties = useCallback(async () => {
    if (!appState.contract) return;
    try {
      const count = await appState.contract.getTotalProperties();
      setTotalProperties(Number(count));
    } catch (error) {
      console.error('Error fetching total properties:', error);
    }
  }, [appState.contract]);

  useEffect(() => {
    fetchTotalProperties();
  }, [fetchTotalProperties]);

  const handleVerifyProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Please connect your wallet first');
      return;
    }

    if (!appState.isAdmin) {
      setMessage('Only admin can verify properties');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const tx = await appState.contract.verifyProperty(propertyId);
      await tx.wait();

      setMessage(`Property ${propertyId} verified successfully! Transaction: ${tx.hash}`);
      setPropertyId('');
      fetchTotalProperties();
    } catch (error: any) {
        const errorMessage = error?.reason || error.message || "An unknown error occurred.";
        setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!appState.isAdmin) {
    return (
      <div>
        <h2>Admin Dashboard</h2>
        <div className="message error-message">
          Access denied. Only admin users can access this section.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      
      <div className="card">
        <h3>System Statistics</h3>
        <div className="property-detail">
          <strong>Total Properties Registered:</strong> <span>{totalProperties}</span>
        </div>
      </div>

      <div className="card">
        <h3>Verify Property</h3>
        <p>Enter a property ID to approve and validate its registration on the blockchain.</p>
        
        <form onSubmit={handleVerifyProperty}>
          <div className="form-group">
            <label htmlFor="propertyId">Property ID:</label>
            <input
              type="number"
              id="propertyId"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <button 
            type="submit" 
            className="button button-primary"
            disabled={loading || !propertyId}
          >
            {loading ? 'Verifying...' : 'Verify Property'}
          </button>
        </form>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>Admin Responsibilities</h3>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-light-color)' }}>
          <li>Verify the authenticity of property registrations.</li>
          <li>Ensure all submitted documents are correct and valid.</li>
          <li>Monitor system activity for fraudulent behavior.</li>
          <li>Oversee the integrity of property transfer processes.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
