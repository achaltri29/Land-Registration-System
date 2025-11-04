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
    
    // Use readOnlyContract for view calls if available, otherwise fall back to contract
    const contractToUse = appState.readOnlyContract || appState.contract;
    
    if (!contractToUse || !appState.signer) {
      setMessage('Error: Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');
    setProperty(null);
    setOwnerHistory([]);

    try {
      // Get property details - use read-only contract for view calls
      const propertyData = await contractToUse.getProperty(propertyId);
      
      const propertyInfo: Property = {
        id: propertyData.id.toString(),
        currentOwner: propertyData.currentOwner,
        location: propertyData.location,
        area: propertyData.area.toString(),
        ipfsDocHash: propertyData.ipfsDocHash,
        verified: propertyData.verified,
        pendingBuyer: propertyData.pendingBuyer
      };

      // Try to get lien info if the contract supports it
      try {
        const lien = await contractToUse.getLienInfo(propertyId);
        if (lien) {
          propertyInfo.lienActive = lien[0];
          propertyInfo.lienLender = lien[1];
          propertyInfo.lienAmount = lien[2]?.toString?.() ?? '0';
          propertyInfo.lienDetails = lien[3];
        }
      } catch (ignored) {
        // Contract might be older without getLienInfo; ignore gracefully
      }

      setProperty(propertyInfo);

      // Get owner history - use read-only contract for view calls
      const history = await contractToUse.getOwnersHistory(propertyId);
      const historyData: OwnerHistory[] = history.map((item: any) => ({
        owner: item.owner,
        timestamp: new Date(Number(item.timestamp) * 1000).toLocaleString(),
        action: item.action
      }));

      // Augment history with lien events (LienPlaced, LienCleared)
      try {
        const provider = (contractToUse as any).runner?.provider || (contractToUse as any).provider;
        // LienPlaced events
        if ((contractToUse as any).filters?.LienPlaced) {
          const placedFilter = (contractToUse as any).filters.LienPlaced(Number(propertyId));
          const placedLogs = await (contractToUse as any).queryFilter(placedFilter);
          for (const log of placedLogs) {
            const lender: string = log.args?.lender ?? log.args?.[2];
            const block = provider && log.blockNumber ? await provider.getBlock(log.blockNumber) : null;
            historyData.push({
              owner: lender,
              action: 'lien_placed',
              timestamp: new Date(((block?.timestamp ?? 0) as number) * 1000).toLocaleString()
            });
          }
        }
        // LienCleared events
        if ((contractToUse as any).filters?.LienCleared) {
          const clearedFilter = (contractToUse as any).filters.LienCleared(Number(propertyId));
          const clearedLogs = await (contractToUse as any).queryFilter(clearedFilter);
          for (const log of clearedLogs) {
            const lender: string = log.args?.lender ?? log.args?.[1];
            const block = provider && log.blockNumber ? await provider.getBlock(log.blockNumber) : null;
            historyData.push({
              owner: lender,
              action: 'lien_cleared',
              timestamp: new Date(((block?.timestamp ?? 0) as number) * 1000).toLocaleString()
            });
          }
        }
      } catch (_) {
        // If events/filters not available, ignore silently
      }

      // Sort by timestamp descending (fallback to current order if unparsable)
      const sorted = [...historyData].sort((a, b) => {
        const ta = Date.parse(a.timestamp) || 0;
        const tb = Date.parse(b.timestamp) || 0;
        return tb - ta;
      });

      setOwnerHistory(sorted);
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
          {property.lienActive && (
            <div className="property-detail">
              <strong>Lien:</strong> <span className="status-badge status-unverified">ACTIVE</span>
              <div style={{ marginTop: '6px', color: 'var(--text-light-color)' }}>
                <div><strong>Lender:</strong> {property.lienLender}</div>
                <div><strong>Amount:</strong> {property.lienAmount}</div>
                {property.lienDetails && <div><strong>Details:</strong> {property.lienDetails}</div>}
              </div>
            </div>
          )}
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

