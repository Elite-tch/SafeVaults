"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, AlertTriangle, Coins, Lock, Calendar, TrendingUp, Info, Plus, Wallet, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from "wagmi";
import { CONTRACTS, VAULT_FACTORY_ABI } from "@/lib/contracts";
import { toast } from "sonner";
import { useEffect } from "react";
import { parseEther, formatEther } from "viem";
import { useProofRails } from "@proofrails/sdk/react";

export default function CreatePersonalVault() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });

    const [formData, setFormData] = useState({
        purpose: "",
        amount: "",
        duration: "30"
    });

    const [customDuration, setCustomDuration] = useState("");
    const FIXED_PENALTY = 10; // Fixed 10% penalty

    // Brand Styled Toast
    const toastStyle = {
        className: "bg-[#E62058]/10 border-[#E62058]/20 text-[#E62058]",
        style: {
            backgroundColor: 'rgba(230, 32, 88, 0.1)',
            borderColor: 'rgba(230, 32, 88, 0.2)',
            color: '#E62058'
        }
    };

    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

    // ProofRails Integration
    const [proofStatus, setProofStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
    const sdk = useProofRails();

    useEffect(() => {
        if (isSuccess && receipt && proofStatus === 'idle') {
            toast.success("Transaction Successful", toastStyle);
            const generateProof = async () => {
                setProofStatus('generating');
                try {
                    console.log("🔄 Starting ProofRails receipt generation...");
                    console.log("API Key present:", !!process.env.NEXT_PUBLIC_PROOFRAILS_KEY);

                    // Create a "Savings" receipt using payment template
                    const receiptResult = await sdk.templates.payment({
                        amount: parseFloat(formData.amount),
                        from: receipt.from,
                        to: receipt.to || CONTRACTS.coston2.VaultFactory,
                        purpose: `SafeVault: ${formData.purpose}`,
                        transactionHash: receipt.transactionHash
                    });

                    console.log("✅ ProofRails Receipt Created:", receiptResult);

                    // Always store receipt data for history viewing
                    const receiptData = {
                        id: receiptResult?.id || `local_${receipt.transactionHash}`,
                        txHash: receipt.transactionHash,
                        timestamp: Date.now(),
                        purpose: formData.purpose,
                        amount: formData.amount,
                        verified: !!receiptResult?.id,
                        type: 'created'
                    };
                    localStorage.setItem(`receipt_${receipt.transactionHash}`, JSON.stringify(receiptData));
                    console.log("💾 Receipt stored in localStorage:", receiptData);



                    setProofStatus('done');
                    toast.success("Receipt Generated", toastStyle);
                    // Delay redirect to show success state
                    setTimeout(() => router.push("/dashboard/vaults"), 1500);
                } catch (e: any) {
                    console.error("❌ Proof generation failed:", e);
                    // ... logs

                    // Even on error, store the transaction for history
                    const fallbackReceipt = {
                        id: `local_${receipt.transactionHash}`,
                        txHash: receipt.transactionHash,
                        timestamp: Date.now(),
                        purpose: formData.purpose,
                        amount: formData.amount,
                        verified: false,
                        type: 'created'
                    };
                    localStorage.setItem(`receipt_${receipt.transactionHash}`, JSON.stringify(fallbackReceipt));

                    toast.error("Receipt Generation Failed", toastStyle);

                    setProofStatus('error');
                    setTimeout(() => router.push("/dashboard/vaults"), 2000);
                }
            };
            generateProof();
        }
    }, [isSuccess, receipt, proofStatus, sdk, formData.amount, formData.purpose, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !address) {
            alert("Please connect your wallet first");
            return;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert("Please enter a valid deposit amount");
            return;
        }

        const durationDays = customDuration ? parseInt(customDuration) : parseInt(formData.duration);
        const unlockTimestamp = Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60);
        const penaltyBps = FIXED_PENALTY * 100; // Fixed 10% = 1000 bps
        const amountWei = parseEther(formData.amount);

        try {
            toast.loading("Initializing Transaction...", toastStyle);
            writeContract({
                address: CONTRACTS.coston2.VaultFactory,
                abi: VAULT_FACTORY_ABI,
                functionName: "createPersonalVault",
                args: [
                    formData.purpose,
                    BigInt(unlockTimestamp),
                    BigInt(penaltyBps)
                ],
                value: amountWei
            });
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const durationDays = customDuration ? parseInt(customDuration) : parseInt(formData.duration);
    const unlockDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const potentialPenalty = formData.amount ? (parseFloat(formData.amount) * FIXED_PENALTY / 100).toFixed(4) : "0";

    return (
        <div className="max-w-4xl mx-auto">
            {/* Direct Vault Creation - No Back Button Needed anymore if this is the only option */}

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="md:col-span-2">
                    <Card className="p-8">
                        <div className="mb-8">

                            <h2 className="text-3xl font-bold text-white mb-2">Create Personal Vault</h2>
                            <p className="text-gray-400">Lock your C2FLR with time-based penalties to enforce savings discipline</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Purpose */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Savings Goal
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., New Laptop, Emergency Fund, Vacation"
                                    required
                                    maxLength={50}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">What are you saving for? This helps you stay motivated.</p>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-primary" />
                                    Initial Deposit Amount
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        required
                                        step="0.0001"
                                        min="0.0001"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-20 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">C2FLR</span>
                                </div>
                                {balance && (
                                    <p className="text-xs text-gray-500">
                                        Available: {parseFloat(formatEther(balance.value)).toFixed(4)} C2FLR
                                    </p>
                                )}
                            </div>

                            {/* Lock Duration */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    Lock Duration
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { days: '7', label: '1 Week' },
                                        { days: '30', label: '1 Month' },
                                        { days: '90', label: '3 Months' },
                                        { days: '180', label: '6 Months' },
                                        { days: '365', label: '1 Year' },
                                        { days: '730', label: '2 Years' }
                                    ].map((option) => (
                                        <button
                                            type="button"
                                            key={option.days}
                                            onClick={() => {
                                                setFormData({ ...formData, duration: option.days });
                                                setCustomDuration("");
                                            }}
                                            className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${formData.duration === option.days
                                                ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20'
                                                : 'border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="font-bold">{option.label}</div>
                                            <div className="text-xs opacity-70">{option.days} days</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Duration Input */}
                                <div className="mt-4">
                                    <label className="text-xs text-gray-400 mb-2 block">Or enter custom duration (days):</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 45, 120, 500"
                                        min="1"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={customDuration}
                                        onChange={(e) => {
                                            setCustomDuration(e.target.value);
                                            setFormData({ ...formData, duration: "" });
                                        }}
                                    />
                                </div>

                                <p className="text-xs text-gray-500">Funds will be locked until: <span className="text-white font-medium">{unlockDate.toLocaleDateString()}</span></p>
                            </div>

                            {/* Fixed Penalty Display */}
                            <div className="p-5 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white mb-1">Early Withdrawal Penalty</h4>
                                        <p className="text-sm text-gray-300">
                                            Breaking your commitment early will incur a fixed penalty to ensure discipline.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <span className="text-sm font-medium text-gray-300">Fixed Penalty Rate</span>
                                    <span className="text-3xl font-bold text-red-400">{FIXED_PENALTY}%</span>
                                </div>

                                <p className="text-xs text-gray-400 mt-3 text-center">
                                    ⚠️ This penalty applies if you withdraw before the unlock date
                                </p>
                            </div>

                            {writeError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-sm text-red-400">
                                        {writeError.message?.includes("RPC")
                                            ? "⚠️ Network issue - Please wait a moment and try again"
                                            : `Error: ${writeError.message || "Failed to create vault"}`}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                className="w-fit text-md flex mx-auto justify-center items-center mt-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-semibold shadow-lg shadow-primary/20"
                                disabled={isPending || isConfirming || !isConnected || proofStatus === 'generating' || proofStatus === 'done'}
                            >
                                {isPending ? "Confirm in Wallet..."
                                    : isConfirming ? "Creating Vault..."
                                        : proofStatus === 'generating' ? "Generating Proof (ProofRails)..."
                                            : proofStatus === 'done' ? "Vault Created & Verified!"
                                                : "Lock Funds & Create Vault"}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-4">
                    <Card className="p-6 bg-gradient-to-br from-white/5 to-white/10 border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary" />
                            Summary
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">You're Locking</p>
                                <p className="text-2xl font-bold text-white">{formData.amount || "0"} C2FLR</p>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Unlock Date</p>
                                <p className="text-sm font-medium text-white">{unlockDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Early Exit Penalty</p>
                                <p className="text-sm font-medium text-red-400">{FIXED_PENALTY}% ({potentialPenalty} C2FLR)</p>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-xs text-red-300">
                                    ⚠️ <strong>Note:</strong> 10% penalty is fixed to ensure commitment discipline.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                        <h4 className="text-sm font-semibold text-green-400 mb-2">✨ What Happens Next?</h4>
                        <ul className="space-y-2 text-xs text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">1.</span>
                                <span>Vault contract deploys to blockchain</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">2.</span>
                                <span>Your funds are locked until unlock date</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">3.</span>
                                <span>Early withdrawal triggers penalty</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">4.</span>
                                <span>After unlock: withdraw anytime, penalty-free</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div >
    );
}
