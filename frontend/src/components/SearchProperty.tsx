import React, { useState } from 'react';
import { AppState, Property, OwnerHistory } from '../types';

interface SearchPropertyProps {
  appState: AppState;
}

const SearchProperty: React.FC<SearchPropertyProps> = ({ appState }) => {
  const [propertyId, setPropertyId] = useState('');
  const [property, setProperty] = useState<Property | null>(null);
  const [ownerHistory, setOwnerHistory] = useState<OwnerHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Get property details
      const propertyData = await appState.contract.getProperty(propertyId);
      
      const propertyInfo: Property = {
        id: propertyData.id.toString(),
        currentOwner: propertyData.currentOwner,
        location: propertyData.location,
        area: propertyData.area.toString(),
        ipfsDocHash: propertyData.ipfsDocHash,
        verified: propertyData.verified,
        pendingBuyer: propertyData.pendingBuyer
      };

      setProperty(propertyInfo);

      // Get owner history
      const history = await appState.contract.getOwnersHistory(propertyId);
      const historyData: OwnerHistory[] = history.map((item: any) => ({
        owner: item.owner,
        timestamp: new Date(Number(item.timestamp) * 1000).toLocaleString(),
        action: item.action
      }));

      setOwnerHistory(historyData);
      setMessage('Property found successfully!');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setProperty(null);
      setOwnerHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusBadge = (verified: boolean, pendingBuyer: string) => {
    if (pendingBuyer !== '0x0000000000000000000000000000000000000000') {
      return <span className="status-badge status-pending">Transfer Pending</span>;
    } else if (verified) {
      return <span className="status-badge status-verified">Verified</span>;
    } else {
      return <span className="status-badge status-unverified">Unverified</span>;
    }
  };

  return (
    <div>
      <h2>Search Property</h2>
      
      <div className="property-card">
        <h3>Search by Property ID</h3>
        <form onSubmit={handleSearch}>
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
            {loading ? 'Searching...' : 'Search Property'}
          </button>
        </form>

        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}
      </div>

      {property && (
        <div className="property-card">
          <h3>Property Details</h3>
          <div className="property-detail">
            <strong>Property ID:</strong> {property.id}
          </div>
          <div className="property-detail">
            <strong>Current Owner:</strong> {formatAddress(property.currentOwner)}
          </div>
          <div className="property-detail">
            <strong>Location:</strong> {property.location}
          </div>
          <div className="property-detail">
            <strong>Area:</strong> {property.area} sq meters
          </div>
          <div className="property-detail">
            <strong>Document Hash:</strong> 
            <div style={{ 
              wordBreak: 'break-all', 
              fontSize: '12px', 
              marginTop: '5px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {property.ipfsDocHash}
            </div>
          </div>
          <div className="property-detail">
            <strong>Status:</strong> {getStatusBadge(property.verified, property.pendingBuyer)}
          </div>
          {property.pendingBuyer !== '0x0000000000000000000000000000000000000000' && (
            <div className="property-detail">
              <strong>Pending Buyer:</strong> {formatAddress(property.pendingBuyer)}
            </div>
          )}
        </div>
      )}

      {ownerHistory.length > 0 && (
        <div className="property-card">
          <h3>Ownership History</h3>
          {ownerHistory.map((item, index) => (
            <div key={index} className="history-item">
              <div className="action">{item.action.toUpperCase()}</div>
              <div><strong>Owner:</strong> {formatAddress(item.owner)}</div>
              <div className="timestamp">{item.timestamp}</div>
            </div>
          ))}
        </div>
      )}

      <div className="property-card">
        <h3>Search Information</h3>
        <p>Use this section to:</p>
        <ul style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.8)' }}>
          <li>View detailed property information</li>
          <li>Check property verification status</li>
          <li>View complete ownership history</li>
          <li>Verify document integrity via IPFS hash</li>
          <li>Check for pending transfers</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchProperty;
