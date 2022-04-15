// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IBaseGateway.sol";

contract BaseGateway is IBaseGateway {

    mapping(bytes32 => NFTTokenInfo) public tokenInfos;
    mapping(address => NFTContractInfo) public contractInfos;
    mapping(address => uint256) public poolsWeights;

    struct NFTTokenInfo {
        uint256[] weights; // list of weights by fomula
        uint256 amounts;
    }

    struct NFTContractInfo {
        uint256[] weights; // list of weights by fomula
        uint256 amounts;
        address[] pools; // pool address for each fomula
        bool increaseable; // applying for the secondary markets transaction weights increasement or not
        uint delta; // percentage for each valid transaction increaced
    }

    constructor() {
    }

    function setNftData(address _nft, address[] memory _pools, bool _increaseable, uint _delta) override external {
        for (uint i = 0; i < _pools.length; i++) {
            address pool = address(_pools[i]) == address(0) ? address(0) : address(_pools[i]);
            contractInfos[_nft].pools[i] = pool;
        }
        contractInfos[_nft].increaseable = _increaseable;
        contractInfos[_nft].delta = _delta;
    }

    function deposit(uint256 _tokenId, uint256 _amount) override external payable {
    }

    function depositWithERC20(uint256 _tokenId, uint256 _amount, address _deopsitToken, uint256 _deopsitTokenAmounts) override external {

    }

    function batchDeposit(uint256 _idFrom, uint256 _offset) override external payable {

    }

    function batchDepositWithERC20(uint256 _idFrom, uint256 _offset, address _deopsitToken, uint256 _deopsitTokenAmounts) override external {

    }

    function baseValue(address _nft, uint256 _tokenId, uint256 _amount) external view override returns (uint256, uint256) {
        bytes32 infoHash = keccak256(abi.encodePacked(_nft, _tokenId));
        address fomulaA =  contractInfos[_nft].pools[0];
        uint256 tokenWeightsA = tokenInfos[infoHash].weights[0];
        uint256 totalBalanceA = poolsWeights[fomulaA];
        uint256 tokenBalanceA = tokenWeightsA / poolsWeights[fomulaA] * totalBalanceA;

        return (tokenWeightsA * _amount, tokenBalanceA * _amount);
    }

    function redeem(address _nft, uint256 _tokenId, uint256 _amount) override external {

    }

    function withdraw(address _to) override external {

    }

    function withdrawWithERC20(address _token, address _to) override external {

    }
}