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
      setMessage('Error: Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');
    setProperty(null);
    setOwnerHistory([]);

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

      setOwnerHistory(historyData.reverse()); // Show most recent first
      setMessage('Property found successfully!');
    } catch (error: any) {
      const errorMessage = error?.reason || error.message || "An unknown error occurred.";
      setMessage(`Error: ${errorMessage}`);
      setProperty(null);
      setOwnerHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Search Property Records</h2>
      
      <div className="card">
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
            className="button button-primary"
            disabled={loading || !propertyId}
          >
            {loading ? 'Searching...' : 'Search Property'}
          </button>
        </form>
      </div>

      {message && !property && (
        <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}

      {property && (
        <div className="card">
          <h3>Property Details (ID: {property.id})</h3>
          <div className="property-detail">
            <strong>Status:</strong> 
            {(() => {
                if (property.pendingBuyer !== '0x0000000000000000000000000000000000000000') {
                    return <span className="status-badge status-pending">Transfer Pending</span>;
                } else if (property.verified) {
                    return <span className="status-badge status-verified">Verified</span>;
                } else {
                    return <span className="status-badge status-unverified">Unverified</span>;
                }
            })()}
          </div>
          <div className="property-detail">
            <strong>Current Owner:</strong> <span>{property.currentOwner}</span>
          </div>
          <div className="property-detail">
            <strong>Location:</strong> <span>{property.location}</span>
          </div>
          <div className="property-detail">
            <strong>Area:</strong> <span>{property.area} sq meters</span>
          </div>
          <div className="property-detail">
            <strong>Document Hash (IPFS):</strong> <span style={{ wordBreak: 'break-all', fontSize: '14px' }}>{property.ipfsDocHash}</span>
          </div>
          {property.pendingBuyer !== '0x0000000000000000000000000000000000000000' && (
            <div className="property-detail">
              <strong>Pending Buyer:</strong> <span>{property.pendingBuyer}</span>
            </div>
          )}
        </div>
      )}

      {ownerHistory.length > 0 && (
        <div className="card">
          <h3>Ownership History</h3>
          {ownerHistory.map((item, index) => (
            <div key={index} className="history-item">
              <div className="action">{item.action.toUpperCase()}</div>
              <div><strong>Owner:</strong> {item.owner}</div>
              <div className="timestamp">{item.timestamp}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Search Information</h3>
        <p>Use this section to:</p>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-light-color)' }}>
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

