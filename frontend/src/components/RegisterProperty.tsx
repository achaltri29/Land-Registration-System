import React, { useState } from 'react';
import { AppState } from '../types';

interface RegisterPropertyProps {
  appState: AppState;
}

const RegisterProperty: React.FC<RegisterPropertyProps> = ({ appState }) => {
  const [formData, setFormData] = useState({
    location: '',
    area: '',
    document: null as File | null
  });
  const [ipfsHash, setIpfsHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        document: file
      }));
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const response = await fetch('http://localhost:3001/upload-doc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64,
              filename: file.name
            })
          });

          const result = await response.json();
          if (result.success) {
            resolve(result.ipfsHash);
          } else {
            reject(new Error(result.error));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appState.contract || !appState.signer) {
      setMessage('Error: Please connect your wallet first');
      return;
    }

    if (!formData.document) {
      setMessage('Error: Please select a document to upload');
      return;
    }

    setLoading(true);
    setMessage('');
    setIpfsHash('');

    try {
      // Step 1: Upload document to IPFS
      setMessage('Step 1/2: Uploading document to IPFS...');
      const hash = await uploadToIPFS(formData.document);
      setIpfsHash(hash);

      // Step 2: Register property on blockchain
      setMessage('Step 2/2: Registering property on the blockchain...');
      const tx = await appState.contract.registerProperty(
        formData.location,
        formData.area,
        hash
      );

      await tx.wait();

      setMessage(`Property registered successfully! Transaction: ${tx.hash}`);
      setFormData({ location: '', area: '', document: null });
    } catch (error: any) {
        const errorMessage = error?.reason || error.message || "An unknown error occurred.";
        setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Register New Property</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="location">Property Location:</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., 123 Main Street, City, State"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">Area (sq meters):</label>
            <input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              placeholder="e.g., 1000"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Property Documents (PDF, JPG, etc.):</label>
            <div className="file-upload">
              <input
                type="file"
                id="document"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
              <label htmlFor="document">
                <div className="file-upload-text">
                  {formData.document ? formData.document.name : 'Click to select document'}
                </div>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="button button-primary"
            disabled={loading || !formData.location || !formData.area || !formData.document}
          >
            {loading ? 'Processing...' : 'Register Property'}
          </button>
        </form>
      </div>
        {message && (
            <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
                {message}
            </div>
        )}
        {ipfsHash && !message.includes('Error') && (
            <div className="message success-message">
                Document successfully uploaded to IPFS: {ipfsHash}
            </div>
        )}
    </div>
  );
};

export default RegisterProperty;
