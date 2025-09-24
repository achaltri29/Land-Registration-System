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
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const response = await fetch(`${API_URL}/upload-doc`, {
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
      setMessage('Please connect your wallet first');
      return;
    }

    if (!formData.document) {
      setMessage('Please select a document to upload');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Upload document to IPFS
      const hash = await uploadToIPFS(formData.document);
      setIpfsHash(hash);

      // Register property on blockchain
      const tx = await appState.contract.registerProperty(
        formData.location,
        formData.area,
        hash
      );

      await tx.wait();

      setMessage(`Property registered successfully! Transaction: ${tx.hash}`);
      setFormData({ location: '', area: '', document: null });
      setIpfsHash('');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Register New Property</h2>
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
          <label>Property Documents:</label>
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

        {ipfsHash && (
          <div className="success-message">
            Document uploaded to IPFS: {ipfsHash}
          </div>
        )}

        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Register Property'}
        </button>
      </form>
    </div>
  );
};

export default RegisterProperty;
