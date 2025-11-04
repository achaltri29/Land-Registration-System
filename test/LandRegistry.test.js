const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
  let landRegistry;
  let owner, user1, user2, user3;
  let propertyId;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await landRegistry.owner()).to.equal(owner.address);
    });

    it("Should initialize property counter to 0", async function () {
      expect(await landRegistry.getTotalProperties()).to.equal(0);
    });
  });

  describe("Property Registration", function () {
    it("Should register a property successfully", async function () {
      const location = "123 Main St, City, State";
      const area = 1000;
      const ipfsHash = "QmTestHash123";

      await expect(landRegistry.connect(user1).registerProperty(location, area, ipfsHash))
        .to.emit(landRegistry, "PropertyRegistered")
        .withArgs(1, user1.address, location, area, ipfsHash);

      const property = await landRegistry.getProperty(1);
      expect(property.id).to.equal(1);
      expect(property.currentOwner).to.equal(user1.address);
      expect(property.location).to.equal(location);
      expect(property.area).to.equal(area);
      expect(property.ipfsDocHash).to.equal(ipfsHash);
      expect(property.verified).to.be.false;
      expect(property.pendingBuyer).to.equal(ethers.ZeroAddress);

      expect(await landRegistry.getTotalProperties()).to.equal(1);
    });

    it("Should fail to register property with empty location", async function () {
      await expect(
        landRegistry.connect(user1).registerProperty("", 1000, "QmTestHash123")
      ).to.be.revertedWith("Location cannot be empty");
    });

    it("Should fail to register property with zero area", async function () {
      await expect(
        landRegistry.connect(user1).registerProperty("123 Main St", 0, "QmTestHash123")
      ).to.be.revertedWith("Area must be greater than 0");
    });

    it("Should fail to register property with empty IPFS hash", async function () {
      await expect(
        landRegistry.connect(user1).registerProperty("123 Main St", 1000, "")
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });
  });

  describe("Property Verification", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerProperty(
        "123 Main St, City, State",
        1000,
        "QmTestHash123"
      );
      propertyId = 1;
    });

    it("Should verify property successfully (admin only)", async function () {
      await expect(landRegistry.connect(owner).verifyProperty(propertyId))
        .to.emit(landRegistry, "PropertyVerified")
        .withArgs(propertyId, owner.address);

      const property = await landRegistry.getProperty(propertyId);
      expect(property.verified).to.be.true;
    });

    it("Should fail to verify property by non-admin", async function () {
      await expect(
        landRegistry.connect(user1).verifyProperty(propertyId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail to verify non-existent property", async function () {
      await expect(
        landRegistry.connect(owner).verifyProperty(999)
      ).to.be.revertedWith("Property does not exist");
    });

    it("Should fail to verify already verified property", async function () {
      await landRegistry.connect(owner).verifyProperty(propertyId);
      
      await expect(
        landRegistry.connect(owner).verifyProperty(propertyId)
      ).to.be.revertedWith("Property already verified");
    });
  });

  describe("Document Update", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerProperty(
        "123 Main St, City, State",
        1000,
        "QmTestHash123"
      );
      propertyId = 1;
    });

    it("Should update document hash successfully", async function () {
      const newHash = "QmNewHash456";
      
      await expect(landRegistry.connect(user1).updateDocumentHash(propertyId, newHash))
        .to.emit(landRegistry, "DocumentUpdated")
        .withArgs(propertyId, user1.address, newHash);

      const property = await landRegistry.getProperty(propertyId);
      expect(property.ipfsDocHash).to.equal(newHash);
    });

    it("Should fail to update document hash by non-owner", async function () {
      await expect(
        landRegistry.connect(user2).updateDocumentHash(propertyId, "QmNewHash456")
      ).to.be.revertedWith("Not the property owner");
    });

    it("Should fail to update with empty hash", async function () {
      await expect(
        landRegistry.connect(user1).updateDocumentHash(propertyId, "")
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });
  });

  describe("Property Transfer", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerProperty(
        "123 Main St, City, State",
        1000,
        "QmTestHash123"
      );
      propertyId = 1;
      await landRegistry.connect(owner).verifyProperty(propertyId);
    });

    it("Should initiate transfer successfully", async function () {
      await expect(landRegistry.connect(user1).initiateTransfer(propertyId, user2.address))
        .to.emit(landRegistry, "TransferInitiated")
        .withArgs(propertyId, user1.address, user2.address);

      const property = await landRegistry.getProperty(propertyId);
      expect(property.pendingBuyer).to.equal(user2.address);
    });

    it("Should fail to initiate transfer by non-owner", async function () {
      await expect(
        landRegistry.connect(user2).initiateTransfer(propertyId, user3.address)
      ).to.be.revertedWith("Not the property owner");
    });

    it("Should fail to initiate transfer of unverified property", async function () {
      // Register new property without verification
      await landRegistry.connect(user3).registerProperty(
        "456 Oak St, City, State",
        2000,
        "QmTestHash456"
      );
      const unverifiedPropertyId = 2;

      await expect(
        landRegistry.connect(user3).initiateTransfer(unverifiedPropertyId, user1.address)
      ).to.be.revertedWith("Property not verified");
    });

    it("Should fail to initiate transfer to zero address", async function () {
      await expect(
        landRegistry.connect(user1).initiateTransfer(propertyId, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid buyer address");
    });

    it("Should fail to initiate transfer to self", async function () {
      await expect(
        landRegistry.connect(user1).initiateTransfer(propertyId, user1.address)
      ).to.be.revertedWith("Cannot transfer to yourself");
    });

    it("Should fail to initiate transfer when already pending", async function () {
      await landRegistry.connect(user1).initiateTransfer(propertyId, user2.address);
      
      await expect(
        landRegistry.connect(user1).initiateTransfer(propertyId, user3.address)
      ).to.be.revertedWith("Transfer already initiated");
    });

    it("Should confirm transfer successfully", async function () {
      await landRegistry.connect(user1).initiateTransfer(propertyId, user2.address);
      
      await expect(landRegistry.connect(user2).confirmTransfer(propertyId))
        .to.emit(landRegistry, "TransferCompleted")
        .withArgs(propertyId, user1.address, user2.address);

      const property = await landRegistry.getProperty(propertyId);
      expect(property.currentOwner).to.equal(user2.address);
      expect(property.pendingBuyer).to.equal(ethers.ZeroAddress);
    });

    it("Should fail to confirm transfer by non-pending buyer", async function () {
      await landRegistry.connect(user1).initiateTransfer(propertyId, user2.address);
      
      await expect(
        landRegistry.connect(user3).confirmTransfer(propertyId)
      ).to.be.revertedWith("Not the pending buyer");
    });

    it("Should fail to confirm transfer when no pending transfer", async function () {
      await expect(
        landRegistry.connect(user2).confirmTransfer(propertyId)
      ).to.be.revertedWith("Not the pending buyer");
    });

    it("Should cancel transfer successfully", async function () {
      await landRegistry.connect(user1).initiateTransfer(propertyId, user2.address);
      
      await landRegistry.connect(user1).cancelTransfer(propertyId);
      
      const property = await landRegistry.getProperty(propertyId);
      expect(property.pendingBuyer).to.equal(ethers.ZeroAddress);
    });

    it("Should fail to cancel transfer when no pending transfer", async function () {
      await expect(
        landRegistry.connect(user1).cancelTransfer(propertyId)
      ).to.be.revertedWith("No pending transfer");
    });
  });

  describe("Owner History", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerProperty(
        "123 Main St, City, State",
        1000,
        "QmTestHash123"
      );
      propertyId = 1;
    });

    it("Should track owner history correctly", async function () {
      // Verify property
      await landRegistry.connect(owner).verifyProperty(propertyId);
      
      // Transfer property
      await landRegistry.connect(user1).initiateTransfer(propertyId, user2.address);
      await landRegistry.connect(user2).confirmTransfer(propertyId);

      const history = await landRegistry.getOwnersHistory(propertyId);
      expect(history.length).to.equal(3);
      
      expect(history[0].owner).to.equal(user1.address);
      expect(history[0].action).to.equal("registered");
      
      expect(history[1].owner).to.equal(user1.address);
      expect(history[1].action).to.equal("verified");
      
      expect(history[2].owner).to.equal(user2.address);
      expect(history[2].action).to.equal("transferred");
    });
  });

  describe("User Properties", function () {
    it("Should track user properties correctly", async function () {
      // Register multiple properties for user1
      await landRegistry.connect(user1).registerProperty("Location 1", 1000, "Hash1");
      await landRegistry.connect(user1).registerProperty("Location 2", 2000, "Hash2");
      
      // Register property for user2
      await landRegistry.connect(user2).registerProperty("Location 3", 3000, "Hash3");

      const user1Properties = await landRegistry.getUserProperties(user1.address);
      const user2Properties = await landRegistry.getUserProperties(user2.address);

      expect(user1Properties.length).to.equal(2);
      expect(user1Properties[0]).to.equal(1);
      expect(user1Properties[1]).to.equal(2);

      expect(user2Properties.length).to.equal(1);
      expect(user2Properties[0]).to.equal(3);
    });
  });

  describe("Property Queries", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerProperty(
        "123 Main St, City, State",
        1000,
        "QmTestHash123"
      );
      propertyId = 1;
    });

    it("Should return correct property verification status", async function () {
      expect(await landRegistry.isPropertyVerified(propertyId)).to.be.false;
      
      await landRegistry.connect(owner).verifyProperty(propertyId);
      
      expect(await landRegistry.isPropertyVerified(propertyId)).to.be.true;
    });

    it("Should fail to query non-existent property", async function () {
      await expect(
        landRegistry.getProperty(999)
      ).to.be.revertedWith("Property does not exist");
    });
  });
});
