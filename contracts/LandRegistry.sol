// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LandRegistry is Ownable {
    // Property structure
    struct Property {
        uint256 id;
        address currentOwner;
        string location;
        uint256 area;
        string ipfsDocHash;
        bool verified;
        address pendingBuyer;
    }

    // Owner history structure
    struct OwnerHistory {
        address owner;
        uint256 timestamp;
        string action; // "registered", "transferred", "verified"
    }

    // State variables
    uint256 public propertyCounter;
    mapping(uint256 => Property) public properties;
    mapping(uint256 => OwnerHistory[]) public ownersHistory;
    mapping(address => uint256[]) public userProperties;

    // Events
    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string location,
        uint256 area,
        string ipfsDocHash
    );
    
    event PropertyVerified(
        uint256 indexed propertyId,
        address indexed verifier
    );
    
    event TransferInitiated(
        uint256 indexed propertyId,
        address indexed seller,
        address indexed buyer
    );
    
    event TransferCompleted(
        uint256 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner
    );
    
    event DocumentUpdated(
        uint256 indexed propertyId,
        address indexed owner,
        string newIpfsDocHash
    );

    // Modifiers
    modifier propertyExists(uint256 _propertyId) {
        require(_propertyId > 0 && _propertyId <= propertyCounter, "Property does not exist");
        _;
    }

    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(properties[_propertyId].currentOwner == msg.sender, "Not the property owner");
        _;
    }

    modifier onlyVerifiedProperty(uint256 _propertyId) {
        require(properties[_propertyId].verified, "Property not verified");
        _;
    }

    // Functions

    /**
     * @dev Register a new property
     * @param _location Location of the property
     * @param _area Area of the property in square meters
     * @param _ipfsDocHash IPFS hash of the property documents
     */
    function registerProperty(
        string memory _location,
        uint256 _area,
        string memory _ipfsDocHash
    ) external {
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(_area > 0, "Area must be greater than 0");
        require(bytes(_ipfsDocHash).length > 0, "IPFS hash cannot be empty");

        propertyCounter++;
        uint256 propertyId = propertyCounter;

        properties[propertyId] = Property({
            id: propertyId,
            currentOwner: msg.sender,
            location: _location,
            area: _area,
            ipfsDocHash: _ipfsDocHash,
            verified: false,
            pendingBuyer: address(0)
        });

        // Add to user's properties
        userProperties[msg.sender].push(propertyId);

        // Add to owner history
        ownersHistory[propertyId].push(OwnerHistory({
            owner: msg.sender,
            timestamp: block.timestamp,
            action: "registered"
        }));

        emit PropertyRegistered(propertyId, msg.sender, _location, _area, _ipfsDocHash);
    }

    /**
     * @dev Verify a property (only admin)
     * @param _propertyId ID of the property to verify
     */
    function verifyProperty(uint256 _propertyId) 
        external 
        onlyOwner 
        propertyExists(_propertyId) 
    {
        require(!properties[_propertyId].verified, "Property already verified");

        properties[_propertyId].verified = true;

        // Add to owner history
        ownersHistory[_propertyId].push(OwnerHistory({
            owner: properties[_propertyId].currentOwner,
            timestamp: block.timestamp,
            action: "verified"
        }));

        emit PropertyVerified(_propertyId, msg.sender);
    }

    /**
     * @dev Update document hash for a property
     * @param _propertyId ID of the property
     * @param _newIpfsDocHash New IPFS hash of the documents
     */
    function updateDocumentHash(
        uint256 _propertyId,
        string memory _newIpfsDocHash
    ) 
        external 
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
    {
        require(bytes(_newIpfsDocHash).length > 0, "IPFS hash cannot be empty");

        properties[_propertyId].ipfsDocHash = _newIpfsDocHash;

        emit DocumentUpdated(_propertyId, msg.sender, _newIpfsDocHash);
    }

    /**
     * @dev Initiate property transfer
     * @param _propertyId ID of the property
     * @param _buyer Address of the buyer
     */
    function initiateTransfer(
        uint256 _propertyId,
        address _buyer
    ) 
        external 
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
        onlyVerifiedProperty(_propertyId)
    {
        require(_buyer != address(0), "Invalid buyer address");
        require(_buyer != msg.sender, "Cannot transfer to yourself");
        require(properties[_propertyId].pendingBuyer == address(0), "Transfer already initiated");

        properties[_propertyId].pendingBuyer = _buyer;

        emit TransferInitiated(_propertyId, msg.sender, _buyer);
    }

    /**
     * @dev Confirm property transfer
     * @param _propertyId ID of the property
     */
    function confirmTransfer(uint256 _propertyId) 
        external 
        propertyExists(_propertyId)
        onlyVerifiedProperty(_propertyId)
    {
        require(properties[_propertyId].pendingBuyer == msg.sender, "Not the pending buyer");
        require(properties[_propertyId].pendingBuyer != address(0), "No pending transfer");

        address previousOwner = properties[_propertyId].currentOwner;
        
        // Update ownership
        properties[_propertyId].currentOwner = msg.sender;
        properties[_propertyId].pendingBuyer = address(0);

        // Update user properties
        userProperties[previousOwner].push(_propertyId); // Remove from previous owner's list
        userProperties[msg.sender].push(_propertyId);

        // Add to owner history
        ownersHistory[_propertyId].push(OwnerHistory({
            owner: msg.sender,
            timestamp: block.timestamp,
            action: "transferred"
        }));

        emit TransferCompleted(_propertyId, previousOwner, msg.sender);
    }

    /**
     * @dev Cancel initiated transfer
     * @param _propertyId ID of the property
     */
    function cancelTransfer(uint256 _propertyId) 
        external 
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
    {
        require(properties[_propertyId].pendingBuyer != address(0), "No pending transfer");

        properties[_propertyId].pendingBuyer = address(0);
    }

    /**
     * @dev Get property details
     * @param _propertyId ID of the property
     * @return Property struct
     */
    function getProperty(uint256 _propertyId) 
        external 
        view 
        propertyExists(_propertyId)
        returns (Property memory) 
    {
        return properties[_propertyId];
    }

    /**
     * @dev Get owner history for a property
     * @param _propertyId ID of the property
     * @return Array of OwnerHistory structs
     */
    function getOwnersHistory(uint256 _propertyId) 
        external 
        view 
        propertyExists(_propertyId)
        returns (OwnerHistory[] memory) 
    {
        return ownersHistory[_propertyId];
    }

    /**
     * @dev Get properties owned by a user
     * @param _user Address of the user
     * @return Array of property IDs
     */
    function getUserProperties(address _user) external view returns (uint256[] memory) {
        return userProperties[_user];
    }

    /**
     * @dev Get total number of properties
     * @return Total property count
     */
    function getTotalProperties() external view returns (uint256) {
        return propertyCounter;
    }

    /**
     * @dev Check if a property is verified
     * @param _propertyId ID of the property
     * @return True if verified, false otherwise
     */
    function isPropertyVerified(uint256 _propertyId) 
        external 
        view 
        propertyExists(_propertyId)
        returns (bool) 
    {
        return properties[_propertyId].verified;
    }
}
