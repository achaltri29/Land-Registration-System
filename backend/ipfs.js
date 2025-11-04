// Pinata configuration
const PINATA_JWT_RAW = process.env.PINATA_JWT || process.env.PINATA_JWT_TOKEN || '';
const PINATA_JWT = PINATA_JWT_RAW.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
const PINATA_BASE_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Upload a file to IPFS via Pinata
 */
const uploadToIPFS = async (fileBuffer, filename) => {
  try {
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT not configured');
    }

    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, filename || 'upload');

    const metadata = { name: filename || 'upload' };
    formData.append('pinataMetadata', JSON.stringify(metadata));

    const options = { cidVersion: 1 };
    formData.append('pinataOptions', JSON.stringify(options));

    const res = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: formData
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Pinata upload failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    console.log(`File uploaded to Pinata: ${filename} -> ${json.IpfsHash}`);
    return json.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw new Error(`Failed to upload file to Pinata: ${error.message}`);
  }
};

/**
 * Retrieve via gateway
 */
const getFromIPFS = async (cid) => {
  try {
    const res = await fetch(`${PINATA_GATEWAY}/ipfs/${cid}`);
    if (!res.ok) {
      throw new Error(`Gateway fetch failed (${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error retrieving from Pinata gateway:', error);
    throw new Error(`Failed to retrieve file from gateway: ${error.message}`);
  }
};

/**
 * Check Pinata auth
 */
const isIPFSConnected = async () => {
  try {
    if (!PINATA_JWT) {
      console.warn('PINATA_JWT not set; Pinata auth test will fail');
      return false;
    }
    const res = await fetch(`${PINATA_BASE_URL}/data/testAuthentication`, {
      headers: { Authorization: `Bearer ${PINATA_JWT}` }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Pinata authentication failed:', res.status, text);
      return false;
    }
    console.log('Pinata authentication successful');
    return true;
  } catch (error) {
    console.error('Pinata connection failed:', error);
    return false;
  }
};

const uploadBase64ToIPFS = async (base64Data, filename) => {
  try {
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const fileBuffer = Buffer.from(base64String, 'base64');
    return await uploadToIPFS(fileBuffer, filename);
  } catch (error) {
    console.error('Error uploading base64 to IPFS:', error);
    throw new Error(`Failed to upload base64 file to IPFS: ${error.message}`);
  }
};

module.exports = {
  uploadToIPFS,
  uploadBase64ToIPFS,
  getFromIPFS,
  isIPFSConnected
};

