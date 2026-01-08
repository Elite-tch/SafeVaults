// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PersonalVault.sol";


/**
 * @title VaultFactory
 * @dev Deploys Native C2FLR Vaults.
 */
contract VaultFactory {
    address[] public allVaults;
    mapping(address => bool) public isVault;
    mapping(address => address[]) public userVaults;

    address public protocolTreasury;

    event PersonalVaultCreated(address indexed vaultAddress, address indexed owner, string purpose, uint256 unlockTime);
    event GroupVaultCreated(address indexed vaultAddress, address indexed creator, string purpose, uint256 memberCount);

    constructor(address _protocolTreasury) {
        protocolTreasury = _protocolTreasury;
    }

    function createPersonalVault(
        string memory _purpose,
        uint256 _unlockTimestamp,
        uint256 _penaltyBps
    ) external payable returns (address) {
        PersonalVault vault = new PersonalVault{value: msg.value}(
            _purpose,
            msg.sender,
            _unlockTimestamp,
            _penaltyBps,
            protocolTreasury
        );

        address vaultAddr = address(vault);
        allVaults.push(vaultAddr);
        userVaults[msg.sender].push(vaultAddr);
        isVault[vaultAddr] = true;

        emit PersonalVaultCreated(vaultAddr, msg.sender, _purpose, _unlockTimestamp);
        return vaultAddr;
    }
    
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    function getUserVaults(address _user) external view returns (address[] memory) {
        return userVaults[_user];
    }
}
