const { expect } = require("chai")
const { ethers, waffle } = require("hardhat")
const { BigNumber } = require("ethers")
const provider = waffle.provider;

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const { soliditySha3 } = require("web3-utils");

describe("NFT Test", function () {
    it("ERC721 ERC20", async function () {
        const MyNFT = await ethers.getContractFactory("ERC721PayWithERC20")
        const myNFT = await MyNFT.deploy(
            "ipfs://contract.json",
            "ipfs://blindbox.json",
            "0xd3e62a11b1c6cf54dec8bea3e9fea96a2e21f80af2ec3e0443f09aa3d48760ef",
            "0x190014dd0d45c08a86870d16a0d8892a4ecec1bca5eb0612298e28eaf24ea294",
            "ipfs://metadataUri/"
        )
        await myNFT.deployed()

        const Gateway = await ethers.getContractFactory("BaseGateway")
        const gateway = await Gateway.deploy()
        await gateway.deployed()

        const [owner, testAccount, projectAccount] = await ethers.getSigners();
        const MockERC20 = await ethers.getContractFactory("MockERC20")
        const mockERC20 = await MockERC20.deploy()
        await mockERC20.deployed()

        const myNFTAddr = myNFT.address
        const mockERC20Addr = mockERC20.address
        const gatewayAddr = gateway.address
        const testAddr = testAccount.address
        const projectAddr = projectAccount.address

        const transferTx = await mockERC20.transfer(testAddr, ethers.utils.parseEther("10000"))
        await transferTx.wait();
        expect(await mockERC20.balanceOf(testAddr)).to.equal(ethers.utils.parseEther("10000"));
        expect(await mockERC20.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("9990000"));
        expect(await mockERC20.balanceOf(projectAddr)).to.equal(0);

        //Test init
        await expect(myNFT._mint(1, [])).to.be.revertedWith("Not initialized yet!");
        const initTx = await myNFT.initialize(mockERC20Addr, gatewayAddr);
        await initTx.wait();
        expect(await myNFT.gateway()).to.equal(gatewayAddr);
        expect(await myNFT.payERC20()).to.equal(mockERC20Addr);

        //Test mint price
        expect(await myNFT.price()).to.equal(ethers.utils.parseEther("80"));

        expect(await myNFT.isMinted(owner.address)).to.equal(false);
        expect(await myNFT.isMinted(testAddr)).to.equal(false);

        await expect(myNFT._mint(0, [])).to.be.revertedWith("Number tokens cannot be 0");
        await myNFT._mint(1, []);
        await myNFT._mint(1, []);
        await myNFT._mint(1, []);

        //Test uri
        expect(await myNFT.tokenURI(1)).to.equal("ipfs://blindbox.json");
        expect(await myNFT.tokenURI(2)).to.equal("ipfs://blindbox.json");
        expect(await myNFT.tokenURI(3)).to.equal("ipfs://blindbox.json");

        expect(await myNFT.contractURI()).to.equal("ipfs://contract.json");
        const setContractDataURITx = await myNFT.setContractDataURI("https://text.contract-data.json");
        await setContractDataURITx.wait();
        expect(await myNFT.contractURI()).to.equal("https://text.contract-data.json");

        const blindBoxOpenedTx = await myNFT.blindBoxOpened();
        await blindBoxOpenedTx.wait();
        //"https://bafybeib2ykmpoogoccw65upva6pgtczu273s7gl26cmwagprh4dowm4tz4.ipfs.nftstorage.link/1.json"
        expect(await myNFT.tokenURI(1)).to.equal("ipfs://metadataUri/1.json");
        expect(await myNFT.tokenURI(2)).to.equal("ipfs://metadataUri/2.json");
        expect(await myNFT.tokenURI(3)).to.equal("ipfs://metadataUri/3.json");

        const setURITx = await myNFT.setURI("https://metadataUri2/");
        await setURITx.wait();
        expect(await myNFT.tokenURI(1)).to.equal("https://metadataUri2/1.json");
        expect(await myNFT.tokenURI(2)).to.equal("https://metadataUri2/2.json");
        expect(await myNFT.tokenURI(3)).to.equal("https://metadataUri2/3.json");

        const metadataFrozenTx = await myNFT.metadataFrozen();
        await metadataFrozenTx.wait();

        await expect(myNFT.setURI("https://test22.ipfs.link/")).to.be.revertedWith("URI Already Frozen");
        expect(await myNFT.tokenURI(1)).to.not.equal("https://test22.ipfs.link/1.json");

        //Test owner mint
        expect(await myNFT.isMinted(owner.address)).to.equal(true);
        expect(await myNFT.isMinted(testAddr)).to.equal(false);

        expect(await mockERC20.balanceOf(gatewayAddr)).to.equal(0);
        expect(await mockERC20.balanceOf(myNFTAddr)).to.equal(0);

        expect(await myNFT.balanceOf(owner.address)).to.equal(3);
        expect(await myNFT.ownerOf(1)).to.equal(owner.address);
        expect(await myNFT.ownerOf(2)).to.equal(owner.address);
        expect(await myNFT.ownerOf(3)).to.equal(owner.address);

        expect(await myNFT.totalSupply()).to.equal(3);

        //Test free mint
        /// https://github.com/miguelmota/merkletreejs-solidity
        //Pre free mint list
        var freeMintList = [
            '0xEEb991702e3472166da495B22F3349A7A3aa638a',
            '0x0EE6bEc1d18F09622BB88E513e45955D3A1668BE',
            '0x957BE3E3856B9F83EBB71b17Bf3c5Cc2b6b0669f',
            '0x06E6e2A35c0B2E8DFD3B3eB50bd8A1c251629a7c',
            '0x5174D4869D7B35A01bd48710b71C45E8BD7cc54F'
        ]

        var leaves = freeMintList.map(address => keccak256(address))
        var tree = new MerkleTree(leaves, keccak256, { sort: true })
        var root = tree.getHexRoot()
        var leaf = keccak256(testAddr).toString('hex')
        var proof = tree.getHexProof(leaf)

    //    console.log("Root: " + root + "\nLeaf: " + leaf + "\nProof= " + proof + "\n")

        await expect(myNFT.connect(testAccount)._mint(1, proof)).to.be.revertedWith("You need to in free mint list");
        await expect(myNFT.connect(testAccount)._mint(1, [])).to.be.revertedWith("You need to in free mint list");
        await expect(myNFT.connect(testAccount)._mint(2, [])).to.be.revertedWith("You need to in free mint list");
        expect(await myNFT.isMinted(testAddr)).to.equal(false)

        freeMintList.push(testAddr)
        leaves = freeMintList.map(address => soliditySha3({type: 'address', value: address}, {type: 'uint256', value: 1}))
        tree = new MerkleTree(leaves, keccak256, { sort: true })
        root = tree.getHexRoot()
        leaf = soliditySha3({type: 'address', value: testAddr}, {type: 'uint256', value: 1}).toString('hex')
        proof = tree.getHexProof(leaf)

        console.log("Root: " + root + "\nLeaf: " + leaf + "\nProof= " + proof + "\n")

        await myNFT.enableFreeMintList(false);
        await expect(myNFT.connect(testAccount)._mint(1, proof)).to.be.revertedWith("Free mint is disable");
        await myNFT.enableFreeMintList(true);

        await myNFT.connect(testAccount)._mint(1, proof);

        expect(await myNFT.balanceOf(testAddr)).to.equal(1);
        expect(await myNFT.isMinted(testAddr)).to.equal(true)

        expect(await mockERC20.balanceOf(gatewayAddr)).to.equal(0);
        expect(await mockERC20.balanceOf(myNFTAddr)).to.equal(0);

        expect(await myNFT.totalSupply()).to.equal(4);

        await myNFT.addFreeMintList([testAddr]);
        expect(await myNFT.freeMintList(testAddr)).to.equal(true);
        await expect(myNFT.connect(testAccount)._mint(1, [])).to.be.revertedWith("You already minted once");
        await expect(myNFT.connect(testAccount)._mint(1, proof)).to.be.revertedWith("You already minted once");
        await myNFT.removedFreeMintList([testAddr]);
        expect(await myNFT.freeMintList(testAddr)).to.equal(false);
        await expect(myNFT.connect(testAccount)._mint(1, [])).to.be.revertedWith("You need to in free mint list");
        expect(await myNFT.balanceOf(testAddr)).to.equal(1);
        expect(await myNFT.totalSupply()).to.be.equal(4);
        await myNFT.enableFreeMintList(false);

        //Test presale $80 BUSD, base value is $40 BUSD
        //Pre whitelist
        var whitelist = [
            '0xEEb991702e3472166da495B22F3349A7A3aa638a',
            '0x0EE6bEc1d18F09622BB88E513e45955D3A1668BE',
            '0x957BE3E3856B9F83EBB71b17Bf3c5Cc2b6b0669f',
            '0x06E6e2A35c0B2E8DFD3B3eB50bd8A1c251629a7c',
            '0x5174D4869D7B35A01bd48710b71C45E8BD7cc54F'
        ]

        leaves = whitelist.map(address => keccak256(address))
        tree = new MerkleTree(leaves, keccak256, { sort: true })
        root = tree.getHexRoot()
        leaf = keccak256(testAddr).toString('hex')
        proof = tree.getHexProof(leaf)

    //    console.log("Root: " + root + "\nLeaf: " + leaf + "\nProof= " + proof + "\n")

        await expect(myNFT.connect(testAccount).mint(1, proof)).to.be.revertedWith("Not in whitelist");

        whitelist.push(testAddr)
        leaves = whitelist.map(address => keccak256(address))
        tree = new MerkleTree(leaves, keccak256, { sort: true })
        root = tree.getHexRoot()
        leaf = keccak256(testAddr).toString('hex')
        proof = tree.getHexProof(leaf)

        console.log("Root: " + root + "\nLeaf: " + leaf + "\nProof= " + proof + "\n")

        await expect(myNFT.connect(testAccount).mint(1, proof)).to.be.revertedWith("insufficient allowance");

        await myNFT.addWhitelist([testAddr]);
        expect(await myNFT.whitelist(testAddr)).to.equal(true);
        await myNFT.removeWhitelist([testAddr]);
        expect(await myNFT.whitelist(testAddr)).to.equal(false);
        await expect(myNFT.connect(testAccount).mint(1, [])).to.be.revertedWith("Not in whitelist");
        await myNFT.addWhitelist([testAddr]);

        await expect(myNFT.connect(testAccount).mint(1, [])).to.be.revertedWith("insufficient allowance");
        expect(await myNFT.balanceOf(testAddr)).to.equal(1);
        expect(await myNFT.totalSupply()).to.be.equal(4);

        var myBalance = BigNumber.from(await mockERC20.balanceOf(testAddr));
        await mockERC20.connect(testAccount).approve(myNFTAddr, await myNFT.price());
        expect(await mockERC20.allowance(testAddr, myNFTAddr)).to.equal(await myNFT.price());
        await myNFT.connect(testAccount).mint(1, []);
        myBalance = myBalance.sub(await myNFT.price());
        expect(await mockERC20.balanceOf(testAddr)).to.equal(myBalance);
        expect(await myNFT.balanceOf(testAddr)).to.equal(2);
        expect(await mockERC20.balanceOf(gatewayAddr)).to.equal(ethers.utils.parseEther("40"));
        expect(await mockERC20.balanceOf(myNFTAddr)).to.equal(ethers.utils.parseEther("40"));

        await mockERC20.connect(testAccount).approve(myNFTAddr, await myNFT.price());
        expect(await mockERC20.allowance(testAddr, myNFTAddr)).to.equal(await myNFT.price());
        await myNFT.connect(testAccount).mint(1, []);
        myBalance = myBalance.sub(await myNFT.price());
        expect(await mockERC20.balanceOf(testAddr)).to.equal(myBalance);
        expect(await myNFT.balanceOf(testAddr)).to.equal(3);
        expect(await mockERC20.balanceOf(gatewayAddr)).to.equal(ethers.utils.parseEther("80"));
        expect(await mockERC20.balanceOf(myNFTAddr)).to.equal(ethers.utils.parseEther("80"));

        //Test public sale $100 BUSD, base value is $50 BUSD
        const setPriceTx = await myNFT.setPrice(ethers.utils.parseEther("100"));
        await setPriceTx.wait();
        expect(await myNFT.price()).to.equal(ethers.utils.parseEther("100"));
        await myNFT.enableWhitelist(false);

        await mockERC20.connect(testAccount).approve(myNFTAddr, await myNFT.price());
        expect(await mockERC20.allowance(testAddr, myNFTAddr)).to.equal(await myNFT.price());
        await myNFT.connect(testAccount).mint(1, []);
        myBalance = myBalance.sub(await myNFT.price());
        expect(await mockERC20.balanceOf(testAddr)).to.equal(myBalance);
        expect(await myNFT.balanceOf(testAddr)).to.equal(4);
        expect(await mockERC20.balanceOf(gatewayAddr)).to.equal(ethers.utils.parseEther("130"));
        expect(await mockERC20.balanceOf(myNFTAddr)).to.equal(ethers.utils.parseEther("130"));

        await mockERC20.connect(testAccount).approve(myNFTAddr, await myNFT.price());
        expect(await mockERC20.allowance(testAddr, myNFTAddr)).to.equal(await myNFT.price());
        await myNFT.connect(testAccount).mint(1, []);
        myBalance = myBalance.sub(await myNFT.price());
        expect(await mockERC20.balanceOf(testAddr)).to.equal(myBalance);
        expect(await myNFT.balanceOf(testAddr)).to.equal(5);
        expect(await mockERC20.balanceOf(gatewayAddr)).to.equal(ethers.utils.parseEther("180"));
        expect(await mockERC20.balanceOf(myNFTAddr)).to.equal(ethers.utils.parseEther("180"));

        expect(await myNFT.totalSupply()).to.equal(8);

        await myNFT._mint(20, []);
        await mockERC20.approve(myNFTAddr, ethers.utils.parseEther("200"));
        expect(await mockERC20.allowance(owner.address, myNFTAddr)).to.equal(ethers.utils.parseEther("200"));
        await myNFT.mint(2, []);

        expect(await myNFT.totalSupply()).to.equal(30);

        /* Please modify NFT.sol field MAX_TOTAL_TOKEN_MINT
        *  Changed 1000 to 30 and open follow comment code to test
        */
    //    await expect(myNFT._mint(1, [])).to.be.revertedWith("Over maximum minted amount");

        //Test withdraw
        await myNFT.withdraw(projectAddr, ethers.utils.parseEther("280"));
        expect(await mockERC20.balanceOf(myNFTAddr)).to.equal(0);
        expect(await mockERC20.balanceOf(projectAddr)).to.equal(ethers.utils.parseEther("280"));
      });
});