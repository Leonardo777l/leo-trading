'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTradeStore, getTradeStats } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { Wallet, Briefcase, Activity } from 'lucide-react';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AccountsPage() {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const trades = useTradeStore(state => state.trades);
    const [selectedAccount, setSelectedAccount] = useState<string>('ALL');

    // Extract unique accounts from trades
    const availableAccounts = useMemo(() => {
        const accounts = new Set(trades.map(t => t.account ? t.account.trim().toUpperCase() : 'PERSONAL'));
        return ['ALL', ...Array.from(accounts)] as string[];
    }, [trades]);

    // Filter trades by selected account
    const filteredTrades = useMemo(() => {
        if (selectedAccount === 'ALL') return trades;
        return trades.filter(t => {
            const acc = t.account ? t.account.trim().toUpperCase() : 'PERSONAL';
            return acc === selectedAccount;
        });
    }, [trades, selectedAccount]);

    const stats = getTradeStats(filteredTrades);

    // Prepare Equity Curve data for the selected account
    const equityData = useMemo(() => {
        let cumulative = 0;
        return filteredTrades.map((t, index) => {
            cumulative += t.netProfit;
            return {
                name: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                vp: cumulative,
                tradeId: index
            };
        });
    }, [filteredTrades]);

    return (
        <>
            <DashboardLayout
                onQuickAdd={() => setIsQuickAddOpen(true)}
            >
                <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                ACCOUNT PERFORMANCE
                            </h1>
                            <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                                Global vs Isolated Metrics
                            </p>
                        </div>
                    </header>

                    {/* Account Selector */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="appearance-none bg-gunmetal-900 border border-gunmetal-700 text-white font-bold text-sm px-6 py-3 rounded-xl pr-12 focus:outline-none focus:border-target/50 transition-all hover:bg-gunmetal-800 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                            >
                                {availableAccounts.map(account => (
                                    <option key={account} value={account}>
                                        {account === 'ALL' ? 'GLOBAL OVERVIEW' : account.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-target">
                                {selectedAccount === 'ALL' ? <Briefcase className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats Overview for Selected Account */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-wider uppercase">Net P&L</span>
                            </div>
                            <span className={`text-3xl font-black ${stats.totalNetProfit >= 0 ? 'text-target' : 'text-stop'}`}>
                                ${stats.totalNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </Card>

                        <Card className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-wider uppercase">Win Rate</span>
                            </div>
                            <span className="text-3xl font-black text-white">
                                {stats.winRate.toFixed(2)}%
                            </span>
                        </Card>

                        <Card className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-wider uppercase">Profit Factor</span>
                            </div>
                            <span className={`text-3xl font-black ${stats.profitFactor >= 2 ? 'text-target' : stats.profitFactor >= 1 ? 'text-white' : 'text-stop'}`}>
                                {stats.profitFactor.toFixed(2)}
                            </span>
                        </Card>

                        <Card className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-wider uppercase">Total Trades</span>
                            </div>
                            <span className="text-3xl font-black text-white">
                                {filteredTrades.length}
                            </span>
                        </Card>
                    </div>

                    {/* Equity Curve for Selected Account */}
                    <Card className="flex-1 min-h-[400px] flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-white tracking-widest uppercase">
                                {selectedAccount === 'ALL' ? 'Global' : selectedAccount} Equity Curve
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Performance isolated to this account.
                            </p>
                        </div>
                        <div className="flex-1 w-full h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={equityData} margin={{ top: 10, right: 10, left: 30, bottom: 25 }}>
                                    <defs>
                                        <filter id="glow-account" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="4" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#555"
                                        tick={{ fill: '#888', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#555"
                                        tick={{ fill: '#888', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={50}
                                        tickFormatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#00C805', fontWeight: 'bold' }}
                                        formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Acumulado']}
                                        labelStyle={{ color: '#888', marginBottom: '4px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="vp"
                                        stroke={stats.totalNetProfit >= 0 ? "#00C805" : "#FF0032"}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: stats.totalNetProfit >= 0 ? "#00C805" : "#FF0032", stroke: '#000', strokeWidth: 2 }}
                                        filter="url(#glow-account)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                </div>
            </DashboardLayout>

            <QuickAddTrade
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
            />
        </>
    );
}

