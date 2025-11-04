# PowerShell script to create .env file for frontend
$envContent = @"
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_API_URL=http://localhost:3001
"@

Set-Content -Path ".env" -Value $envContent
Write-Host ".env file created successfully!"


