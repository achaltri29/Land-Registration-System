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
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyViaBackend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setMessage('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: propertyId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`Property ${propertyId} verified successfully! Transaction: ${result.transactionHash}`);
        setPropertyId('');
        fetchTotalProperties();
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!appState.isAdmin) {
    return (
      <div>
        <h2>Admin Dashboard</h2>
        <div className="error-message">
          Access denied. Only admin users can access this section.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      
      <div className="property-card">
        <h3>System Statistics</h3>
        <div className="property-detail">
          <strong>Total Properties:</strong> {totalProperties}
        </div>
      </div>

      <div className="property-card">
        <h3>Verify Property</h3>
        <p>Enter a property ID to verify it as a valid property.</p>
        
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
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Property (Direct)'}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <strong>OR</strong>
        </div>

        <form onSubmit={verifyViaBackend}>
          <div className="form-group">
            <label htmlFor="propertyIdBackend">Property ID (via Backend):</label>
            <input
              type="number"
              id="propertyIdBackend"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
            style={{ background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)' }}
          >
            {loading ? 'Verifying...' : 'Verify Property (Backend)'}
          </button>
        </form>

        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}
      </div>

      <div className="property-card">
        <h3>Admin Actions</h3>
        <p>As an admin, you can:</p>
        <ul style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.8)' }}>
          <li>Verify property registrations</li>
          <li>Monitor system activity</li>
          <li>Access all property records</li>
          <li>Oversee transfer processes</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
