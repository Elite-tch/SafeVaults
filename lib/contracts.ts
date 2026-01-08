// -------------------- Config --------------------
export const CONTRACTS = {
    coston2: {
        VaultFactory: "0x81149a0E0eB69285362bAB5085a4CB852F2A3e07" as `0x${string}`,
    },
} as const;

export const VAULT_FACTORY_ABI = [
    {
        inputs: [
            { name: "_purpose", type: "string" },
            { name: "_unlockTimestamp", type: "uint256" },
            { name: "_penaltyBps", type: "uint256" }
        ],
        name: "createPersonalVault",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [{ name: "user", type: "address" }],
        name: "getUserVaults",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function"
    }
] as const;

export const VAULT_ABI = [
    {
        inputs: [],
        name: "purpose",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "totalAssets",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "unlockTimestamp",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "deposit",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;
