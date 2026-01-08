"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, ExternalLink, CheckCircle, History, Calendar, Clock, AlertTriangle, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface ReceiptData {
    id: string;
    txHash: string;
    timestamp: number;
    purpose: string;
    amount: string;
    verified?: boolean;
    type?: 'created' | 'breaked' | 'completed';
    penalty?: string;
}

export default function HistoryPage() {
    const [receipts, setReceipts] = useState<ReceiptData[]>([]);

    useEffect(() => {
        // Load all receipts from localStorage
        const loadReceipts = () => {
            const allReceipts: ReceiptData[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('receipt_')) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            const parsed = JSON.parse(data);
                            // Backwards compatibility
                            if (!parsed.type) parsed.type = 'created';
                            allReceipts.push(parsed);
                        } catch (e) {
                            console.error("Failed to parse receipt:", e);
                        }
                    }
                }
            }
            // Sort by timestamp (newest first)
            allReceipts.sort((a, b) => b.timestamp - a.timestamp);
            setReceipts(allReceipts);
        };

        loadReceipts();
    }, []);

    const viewOnExplorer = (txHash: string) => {
        window.open(`https://coston2-explorer.flare.network/tx/${txHash}`, '_blank');
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
                <p className="text-gray-400">View your ProofRails verified transaction receipts</p>
            </div>

            {receipts.length === 0 ? (
                <Card className="border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Receipt className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No Receipts Yet</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                        Create your first vault to start generating verified ProofRails receipts
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {receipts.map((receipt, index) => (
                        <motion.div
                            key={receipt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-6 hover:border-primary/50 transition-all">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-start gap-4">

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-white">{receipt.purpose}</h3>
                                                {/* Tags */}
                                                {receipt.type === 'breaked' && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-500 border border-red-500/20">Breaked</span>
                                                )}
                                                {receipt.type === 'completed' && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-500 border border-green-500/20">Completed</span>
                                                )}
                                                {receipt.type === 'created' && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-orange-500/10 text-orange-500 border border-blue-500/20">Created</span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(receipt.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Receipt className="w-3 h-3" />
                                                    <span className="font-mono text-xs">
                                                        TX: {receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-8)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">Amount</p>
                                            <p className="text-lg font-bold text-white">{receipt.amount} C2FLR</p>
                                            {receipt.penalty && (
                                                <p className="text-xs text-red-500 font-medium mt-1">
                                                    -{receipt.penalty} Penalty
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => viewOnExplorer(receipt.txHash)}
                                                className="gap-2"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Explorer
                                            </Button>

                                            {receipt.verified ? (
                                                <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                    <button
                                                        onClick={() => window.open(`https://proofrails-clone-middleware.onrender.com/receipt/${receipt.id}`, '_blank')}
                                                        className="text-xs cursor-pointer text-green-400 font-medium bg-transparent hover:underline">ProofRails Verified </button>
                                                </div>
                                            ) : (
                                                <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-md flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-orange-400" />
                                                    <span className="text-xs text-orange-400 font-medium">Pending</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
