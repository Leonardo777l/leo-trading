'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTradeStore } from '@/store/useTradeStore';
import { usePropFirmStore } from '@/store/usePropFirmStore';
import { computePropFirmStats } from '@/lib/propFirmLogic';
import { Card } from '@/components/ui/Card';
import { Plus, Wallet, Target, AlertTriangle, Play, CheckCircle2, XOctagon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';

export default function AccountsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const trades = useTradeStore(state => state.trades);
    const { accounts, addAccount, deleteAccount } = usePropFirmStore();
    
    const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
    const [isCreating, setIsCreating] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    // New Account Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'Topstep' | 'Lucid Flex' | 'My Funded Futures'>('Topstep');
    const [newBalance, setNewBalance] = useState(50000);

    const handleCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        
        let drawdownLimit = 2000;
        let profitTarget = 3000;
        let drawdownType: 'EOD' | 'Static' | 'Trailing' = 'EOD';
        let maxDrawdownCap = undefined;

        if (newType === 'Topstep') {
            if (newBalance === 50000) { drawdownLimit = 2000; profitTarget = 3000; }
            if (newBalance === 100000) { drawdownLimit = 3000; profitTarget = 6000; }
            if (newBalance === 150000) { drawdownLimit = 4500; profitTarget = 9000; }
            drawdownType = 'EOD';
        } else if (newType === 'Lucid Flex') {
            if (newBalance === 50000) { drawdownLimit = 2500; profitTarget = 3000; } // Assuming typical numbers
            drawdownType = 'Static';
        } else if (newType === 'My Funded Futures') {
            if (newBalance === 50000) { drawdownLimit = 2000; profitTarget = 3000; maxDrawdownCap = newBalance + 100; }
            drawdownType = 'EOD';
        }

        addAccount({
            name: newName || `${newType} ${newBalance / 1000}K`,
            type: newType,
            balance: newBalance,
            drawdownLimit,
            drawdownType,
            profitTarget,
            maxDrawdownCap,
            isActive: true
        });
        
        setIsCreating(false);
        setNewName('');
    };

    const selectedAccountParams = accounts.find(a => a.id === selectedAccountId);

    const filteredTrades = useMemo(() => {
        if (!selectedAccountParams) return [];
        return trades.filter(t => t.account?.toUpperCase() === selectedAccountParams.name.toUpperCase());
    }, [trades, selectedAccountParams]);

    const stats = useMemo(() => {
        if (!selectedAccountParams) return null;
        return computePropFirmStats(selectedAccountParams, filteredTrades);
    }, [selectedAccountParams, filteredTrades]);

    if (!mounted) return null;

    return (
        <>
            <DashboardLayout onQuickAdd={() => setIsQuickAddOpen(true)}>
                <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                PROP FIRM TRACKER
                            </h1>
                            <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                                Liquidity & Rules Management
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {isCreating ? (
                                <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gunmetal-800 text-white rounded-lg text-sm font-bold border border-gunmetal-700">Cancel</button>
                            ) : (
                                <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg text-sm font-bold shadow-lg">
                                    <Plus className="w-4 h-4" /> Add Account
                                </button>
                            )}
                        </div>
                    </header>

                    {isCreating && (
                        <Card className="border border-target/50">
                            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
                                <h3 className="text-lg font-bold text-white">Create New Challenge / Live Account</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-semibold uppercase">Nickname</label>
                                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. TF Eval 1" className="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-2.5 text-white text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-semibold uppercase">Firm / Ruleset</label>
                                        <select value={newType} onChange={(e) => setNewType(e.target.value as 'Topstep' | 'Lucid Flex' | 'My Funded Futures')} className="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-2.5 text-white text-sm">
                                            <option value="Topstep">Topstep (EOD Drawdown)</option>
                                            <option value="My Funded Futures">My Funded Futures (EOD Trailing to +$100)</option>
                                            <option value="Lucid Flex">Lucid Flex (Static Drawdown)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-semibold uppercase">Account Size</label>
                                        <select value={newBalance} onChange={(e) => setNewBalance(Number(e.target.value))} className="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-2.5 text-white text-sm">
                                            <option value={50000}>$50,000</option>
                                            <option value={100000}>$100,000</option>
                                            <option value={150000}>$150,000</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="mt-2 bg-target text-black font-bold py-2.5 rounded-lg w-full md:w-auto px-8 self-end hover:brightness-110 transition">
                                    Initialize Tracker
                                </button>
                            </form>
                        </Card>
                    )}

                    {!isCreating && accounts.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => setSelectedAccountId(acc.id)}
                                    className={`flex-shrink-0 px-5 py-3 rounded-xl border font-bold text-sm transition-all ${
                                        selectedAccountId === acc.id 
                                        ? 'bg-gunmetal-800 border-target/50 text-white shadow-[inset_0_1px_4px_rgba(0,214,50,0.1)]' 
                                        : 'bg-gunmetal-900 border-gunmetal-700 text-gray-500 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {acc.name}
                                        <span className={`w-2 h-2 rounded-full ${acc.isActive ? 'bg-target' : 'bg-gray-600'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedAccountParams && stats && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Top Stats Banner */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <Card className="lg:col-span-1 flex flex-col justify-center items-center text-center p-6 bg-gradient-to-b from-gunmetal-800 to-gunmetal-900">
                                    {stats.isFailed ? (
                                        <XOctagon className="w-12 h-12 text-stop mb-2 drop-shadow-[0_0_15px_rgba(255,51,75,0.5)]" />
                                    ) : stats.isPassed ? (
                                        <CheckCircle2 className="w-12 h-12 text-target mb-2 drop-shadow-[0_0_15px_rgba(0,214,50,0.5)]" />
                                    ) : (
                                        <Play className="w-12 h-12 text-blue-500 mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    )}
                                    <h2 className="text-2xl font-black text-white">{stats.isFailed ? 'FAILED' : stats.isPassed ? 'PASSED' : 'ACTIVE'}</h2>
                                    <p className="text-sm text-gray-400">{selectedAccountParams.type} • ${selectedAccountParams.balance / 1000}K</p>
                                    
                                    <button onClick={() => deleteAccount(selectedAccountParams.id)} className="mt-6 text-xs text-red-500 opacity-50 hover:opacity-100 uppercase tracking-wider font-bold">
                                        Delete Account
                                    </button>
                                </Card>

                                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Card className="flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Target className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Profit Target</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-300">
                                                ${stats.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})} / ${selectedAccountParams.profitTarget.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gunmetal-800 rounded-full h-2 mb-2 overflow-hidden border border-gunmetal-700">
                                            <div 
                                                className="bg-target h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, Math.max(0, (stats.totalProfit / selectedAccountParams.profitTarget) * 100))}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500 font-semibold h-4">
                                            <span>Start: 0%</span>
                                            <span>Goal: 100%</span>
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <AlertTriangle className="w-4 h-4 text-stop" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Drawdown Buffer</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-300">
                                                ${stats.distanceToDrawdown.toLocaleString(undefined, {minimumFractionDigits: 2})} left
                                            </span>
                                        </div>
                                        {/* Distance to drawdown bar. 100% means full buffer. 0% means failed. */}
                                        <div className="w-full bg-gunmetal-800 rounded-full h-2 mb-2 overflow-hidden border border-gunmetal-700 flex justify-end">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-1000 ${stats.distanceToDrawdown < selectedAccountParams.drawdownLimit * 0.2 ? 'bg-stop' : 'bg-breakeven'}`}
                                                style={{ width: `${Math.min(100, Math.max(0, (stats.distanceToDrawdown / selectedAccountParams.drawdownLimit) * 100))}%` }}
                                            />
                                        </div>
                                         <div className="flex justify-between text-[10px] text-gray-500 font-semibold h-4">
                                            <span>Elimination</span>
                                            <span>Safe</span>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <Card className="h-[400px] flex flex-col">
                                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-widest uppercase">
                                            Trajectory vs {selectedAccountParams.drawdownType} Drawdown
                                        </h3>
                                        <p className="text-xs text-gray-500">Live balance compared to your failure curve.</p>
                                    </div>
                                    <div className="flex gap-4 mt-2 sm:mt-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-target rounded-full"></div>
                                            <span className="text-xs text-gray-400 font-bold">Balance</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-stop rounded-full"></div>
                                            <span className="text-xs text-gray-400 font-bold">Max Loss Line</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full h-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f22" vertical={false} />
                                            <XAxis dataKey="date" stroke="#555" fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
                                            <YAxis 
                                                stroke="#555" 
                                                fontSize={11} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                domain={['dataMin - 500', 'dataMax + 500']}
                                                tickFormatter={(val) => `$${val.toLocaleString()}`}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#131316', border: '1px solid #27272A', borderRadius: '8px' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                                labelStyle={{ color: '#888', marginBottom: '4px' }}
                                            />
                                            <Line type="stepAfter" dataKey="drawdownFloor" stroke="#FF334B" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Failure Level" />
                                            <Line type="monotone" dataKey="balance" stroke="#00D632" strokeWidth={3} dot={{ r: 3, fill: '#00D632', stroke: '#131316', strokeWidth: 2 }} name="Balance" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="flex justify-end mt-4">
                               <button onClick={() => setIsQuickAddOpen(true)} className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-gray-200 transition">
                                   + Log Trade for {selectedAccountParams.name}
                               </button>
                            </div>

                        </div>
                    )}

                    {accounts.length === 0 && !isCreating && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500 min-h-[400px]">
                            <Wallet className="w-16 h-16 opacity-20" />
                            <p>No Prop Firm Challenges tracked yet.</p>
                        </div>
                    )}
                </div>
            </DashboardLayout>
            <QuickAddTrade isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} defaultAccount={selectedAccountParams?.name} />
        </>
    );
}
