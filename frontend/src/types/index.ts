// Global type definitions for the Land Registry System

export interface AppState {
  provider: any;
  signer: any;
  contract: any;
  account: string | null;
  isAdmin: boolean;
  isConnected: boolean;
}

export interface Property {
  id: string;
  currentOwner: string;
  location: string;
  area: string;
  ipfsDocHash: string;
  verified: boolean;
  pendingBuyer: string;
}

export interface OwnerHistory {
  owner: string;
  timestamp: string;
  action: string;
}

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
