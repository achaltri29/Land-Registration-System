import { ethers } from 'ethers';

/**
 * Wait for a transaction to be confirmed using the appropriate provider
 * For localhost, uses direct localhost connection to avoid MetaMask RPC errors
 */
export async function waitForTransaction(
  tx: ethers.ContractTransactionResponse,
  isLocalhost: boolean
): Promise<ethers.ContractTransactionReceipt> {
  if (isLocalhost) {
    // For localhost, use direct connection to avoid MetaMask RPC errors
    const localhostProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    // Wait for transaction with confirmations (null means wait until confirmed)
    const receipt = await localhostProvider.waitForTransaction(tx.hash, null, 60000);
    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }
    return receipt as ethers.ContractTransactionReceipt;
  } else {
    // For other networks, use the transaction's provider
    // tx.wait() returns Promise<ContractTransactionReceipt>, so it won't be null
    return await tx.wait() as ethers.ContractTransactionReceipt;
  }
}

