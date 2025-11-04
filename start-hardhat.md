# Starting Hardhat Node

## Step 1: Open a new terminal and run:
```powershell
npx hardhat node
```

This will start Hardhat on localhost:8545. Keep this terminal open and running.

## Step 2: In another terminal, deploy the contract:
```powershell
npx hardhat run scripts/deploy.js --network localhost
```

This will deploy the contract and update `contract-address.json`.

## Step 3: Verify the contract address in frontend/.env matches contract-address.json

## Step 4: Restart your React app if it's running

The app should now connect successfully!


