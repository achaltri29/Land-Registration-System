# MetaMask Localhost Setup Guide

## Issue: MetaMask showing "Malicious" warnings for localhost transactions

This is a common false positive when developing on localhost. Here's how to fix it:

### Option 1: Review and Approve Alerts
1. Click **"Review alerts"** in the MetaMask popup
2. Look for options to:
   - "I understand the risks" or "Proceed anyway"
   - "Add to approved sites" or "Trust this site"
   - Scroll down to see if there's a "Continue" button

### Option 2: Disable Security Warnings for Localhost (Recommended for Development)

1. Open MetaMask
2. Click the **Settings** icon (gear icon)
3. Go to **Security & Privacy**
4. Look for options related to:
   - "Phishing Detection" - you can disable this for localhost
   - "Transaction Security" - you can disable warnings for localhost
5. Add `http://localhost:3000` to your approved sites list

### Option 3: Manually Approve Contract Address

1. In MetaMask, go to **Settings** > **Security & Privacy**
2. Look for "Token Contract Security" or "Contract Address Security"
3. Add your contract address (`0x5FbDB2315678afecb367f032d93F642f64180aa3`) to approved contracts

### Option 4: Use MetaMask's Advanced Settings

1. Open MetaMask
2. Click the **three dots** (menu) > **Settings**
3. Go to **Advanced**
4. Scroll down to find:
   - "Allow transactions on localhost" - Enable this
   - "Disable security warnings for localhost" - Enable this

### Option 5: Verify Network Configuration

Make sure your localhost network is properly configured:
- **Network Name:** Hardhat Local (or any name you prefer)
- **RPC URL:** http://127.0.0.1:8545
- **Chain ID:** 31337
- **Currency Symbol:** ETH

### Quick Fix: Close and Retry

Sometimes simply:
1. **Cancel** the transaction
2. **Refresh** your browser page
3. **Try the transaction again**

The warning might not appear the second time.

### If All Else Fails

You can temporarily use a test account that has lower security settings, or disable MetaMask's phishing detection for localhost development.

**Note:** These warnings are normal for localhost development and don't indicate an actual security issue. They're MetaMask's way of protecting users from potentially malicious contracts on unknown networks.


