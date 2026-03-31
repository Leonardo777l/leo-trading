'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTradeStore, Direction, Outcome, EstadoMental } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';

interface QuickAddTradeProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickAddTrade = ({ isOpen, onClose }: QuickAddTradeProps) => {
    const addTrade = useTradeStore(state => state.addTrade);
    const selectedStrategy = useTradeStore(state => state.selectedStrategy);
    const trades = useTradeStore(state => state.trades);

    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [direction, setDirection] = useState<Direction>('Long');
    const [outcome, setOutcome] = useState<Outcome>('TP');
    const [targetMoney, setTargetMoney] = useState<number | ''>('');
    const [stopMoney, setStopMoney] = useState<number | ''>('');
    const [contracts, setContracts] = useState<number>(1);
    const [estadoMental, setEstadoMental] = useState<EstadoMental>('Calm');
    const [imageLink, setImageLink] = useState('');
    const [account, setAccount] = useState('PERSONAL');
    const [instrument, setInstrument] = useState('NQ');
    const [strategy, setStrategy] = useState(selectedStrategy === 'ALL' ? 'Order Flow' : selectedStrategy);
    const [notes, setNotes] = useState('');
    const [isNewAccount, setIsNewAccount] = useState(false);
    const [isNewStrategy, setIsNewStrategy] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeAccounts = useMemo(() => {
        const accounts = trades.map(t => t.account ? t.account.trim().toUpperCase() : 'PERSONAL');
        const uniqueAccounts = Array.from(new Set(accounts));
        return uniqueAccounts.length > 0 ? uniqueAccounts.sort() : ['PERSONAL'];
    }, [trades]);

    const activeStrategies = useMemo(() => {
        const strats = trades.map(t => t.strategy ? t.strategy.trim() : 'Order Flow');
        const unique = Array.from(new Set(strats));
        if (!unique.includes('Order Flow')) unique.push('Order Flow');
        if (!unique.includes('Liquidez')) unique.push('Liquidez');
        return unique.sort();
    }, [trades]);

    const getInstrumentInfo = (inst: string) => {
        switch (inst.toUpperCase()) {
            case 'NQ': return { tickValue: 5.00, comm: 4.10, ticksPerPoint: 4 };
            case 'ES': return { tickValue: 12.50, comm: 4.10, ticksPerPoint: 4 };
            case 'MES': return { tickValue: 1.25, comm: 1.20, ticksPerPoint: 4 };
            case 'CL': return { tickValue: 10.00, comm: 4.50, ticksPerPoint: 100 }; 
            case 'GC': return { tickValue: 10.00, comm: 4.50, ticksPerPoint: 10 }; 
            case 'MNQ':
            default: return { tickValue: 0.50, comm: 1.20, ticksPerPoint: 4 };
        }
    };

    const instrumentInfo = useMemo(() => getInstrumentInfo(instrument), [instrument]);
    const { tickValue, comm, ticksPerPoint } = instrumentInfo;

    const calculatedTicksTarget = targetMoney ? Math.round(Number(targetMoney) / (tickValue * contracts)) : 0;
    const calculatedStopTicks = stopMoney ? Math.round(Number(stopMoney) / (tickValue * contracts)) : 0;
    const targetPoints = calculatedTicksTarget / ticksPerPoint;
    const stopPoints = calculatedStopTicks / ticksPerPoint;
    
    const totalComm = contracts * comm;
    const estimatedPnL = outcome === 'TP' 
        ? (Number(targetMoney) || 0) - totalComm 
        : outcome === 'SL' 
            ? -(Number(stopMoney) || 0) - totalComm 
            : -totalComm;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Force local midday to prevent UTC midnight timezone shift bugs
        // e.g. "2026-03-11" -> "2026-03-11T12:00:00"
        const safeDate = date.includes('T') ? date : `${date}T12:00:00`;

        try {
            await addTrade({
                date: new Date(safeDate).toISOString(),
                direction,
                outcome,
                ticksTarget: calculatedTicksTarget,
                stopTicks: calculatedStopTicks,
                contracts: Number(contracts),
                estadoMental,
                imageLink,
                account,
                instrument,
                notes,
                strategy
            });
            
            setIsSubmitting(false);
            onClose();
            setTargetMoney('');
            setStopMoney('');
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            alert(`Error al guardar la entrada: ${errorMessage}`);
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-lg z-10"
                    >
                        <Card glowColor={outcome === 'TP' ? 'emerald' : outcome === 'SL' ? 'crimson' : 'amber'}>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors focus:outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-xl font-bold mb-6 tracking-tight text-white">Quick Add Trade</h2>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Direction</label>
                                        <select
                                            value={direction}
                                            onChange={(e) => setDirection(e.target.value as Direction)}
                                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="Long">Long</option>
                                            <option value="Short">Short</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Outcome</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['TP', 'SL', 'BE'] as Outcome[]).map((o) => (
                                            <button
                                                key={o}
                                                type="button"
                                                onClick={() => setOutcome(o)}
                                                className={`py-2 rounded-lg text-sm font-medium transition-all ${outcome === o
                                                    ? o === 'TP' ? 'bg-target/20 text-target border border-target/50'
                                                        : o === 'SL' ? 'bg-stop/20 text-stop border border-stop/50'
                                                            : 'bg-breakeven/20 text-breakeven border border-breakeven/50'
                                                    : 'bg-gunmetal-800 text-gray-400 border border-gunmetal-700 hover:bg-gunmetal-700'
                                                    }`}
                                            >
                                                {o}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Target ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={targetMoney}
                                            onChange={(e) => setTargetMoney(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="Obtained ($)"
                                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Stop ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={stopMoney}
                                            onChange={(e) => setStopMoney(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="Risked ($)"
                                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Contracts</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={contracts}
                                            onChange={(e) => setContracts(Number(e.target.value))}
                                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors"
                                        />
                                    </div>
                                </div>
                                
                                <div className="p-3 bg-gunmetal-900 border border-gunmetal-700 rounded-lg flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        <span>Calculated Stats ({instrument})</span>
                                        <span className={estimatedPnL > 0 ? 'text-target' : estimatedPnL < 0 ? 'text-stop' : 'text-breakeven'}>
                                            Est. PnL: ${estimatedPnL.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Target Points:</span>
                                            <span className="text-white font-mono">{targetPoints > 0 ? targetPoints.toFixed(2) : '0.00'} pts</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Stop Points:</span>
                                            <span className="text-white font-mono">{stopPoints > 0 ? stopPoints.toFixed(2) : '0.00'} pts</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mental State</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Calm', 'Anxiety', 'FOMO'] as EstadoMental[]).map((em) => (
                                            <button
                                                key={em}
                                                type="button"
                                                onClick={() => setEstadoMental(em)}
                                                className={`py-2 rounded-lg text-sm font-medium transition-all ${estadoMental === em
                                                    ? em === 'Calm' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                                        : em === 'Anxiety' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                                                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                                    : 'bg-gunmetal-800 text-gray-400 border border-gunmetal-700 hover:bg-gunmetal-700'
                                                    }`}
                                            >
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account</label>
                                        {isNewAccount ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="NEW ACCOUNT"
                                                    value={account}
                                                    onChange={(e) => setAccount(e.target.value.toUpperCase())}
                                                    className="w-full bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors uppercase"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsNewAccount(false);
                                                        setAccount(activeAccounts[0] || 'PERSONAL');
                                                    }}
                                                    className="px-3 bg-gunmetal-800 border border-gunmetal-700 hover:bg-gunmetal-700 rounded-lg text-gray-400 transition-colors flex items-center justify-center shrink-0"
                                                    title="Cancel New Account"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                value={activeAccounts.includes(account) ? account : (account ? 'NEW' : activeAccounts[0] || 'PERSONAL')}
                                                onChange={(e) => {
                                                    if (e.target.value === 'NEW') {
                                                        setAccount('');
                                                        setIsNewAccount(true);
                                                    } else {
                                                        setAccount(e.target.value);
                                                    }
                                                }}
                                                className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors appearance-none cursor-pointer uppercase"
                                            >
                                                {activeAccounts.map(acc => (
                                                    <option key={acc} value={acc}>{acc}</option>
                                                ))}
                                                <option value="NEW">+ Add New Account</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Instrument</label>
                                        <select
                                            value={instrument}
                                            onChange={(e) => setInstrument(e.target.value)}
                                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="NQ">NQ (Nasdaq)</option>
                                            <option value="MNQ">MNQ (Micro Nasdaq)</option>
                                            <option value="ES">ES (S&P 500)</option>
                                            <option value="MES">MES (Micro S&P)</option>
                                            <option value="CL">CL (Crude Oil)</option>
                                            <option value="GC">GC (Gold)</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Strategy</label>
                                        {isNewStrategy ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="NEW STRATEGY"
                                                    value={strategy}
                                                    onChange={(e) => setStrategy(e.target.value)}
                                                    className="w-full bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsNewStrategy(false);
                                                        setStrategy(activeStrategies[0] || 'Order Flow');
                                                    }}
                                                    className="px-3 bg-gunmetal-800 border border-gunmetal-700 hover:bg-gunmetal-700 rounded-lg text-gray-400 transition-colors flex items-center justify-center shrink-0"
                                                    title="Cancel New Strategy"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                value={activeStrategies.includes(strategy) ? strategy : (strategy ? 'NEW' : activeStrategies[0] || 'Order Flow')}
                                                onChange={(e) => {
                                                    if (e.target.value === 'NEW') {
                                                        setStrategy('');
                                                        setIsNewStrategy(true);
                                                    } else {
                                                        setStrategy(e.target.value);
                                                    }
                                                }}
                                                className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors appearance-none cursor-pointer"
                                            >
                                                {activeStrategies.map(strat => (
                                                    <option key={strat} value={strat}>{strat.toUpperCase()}</option>
                                                ))}
                                                <option value="NEW">+ Add New Strategy</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Image / Link (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://tradingview.com/x/..."
                                        value={imageLink}
                                        onChange={(e) => setImageLink(e.target.value)}
                                        className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Trading Notes (Optional)</label>
                                    <textarea
                                        placeholder="e.g. FVG, Liquidity Pool bounce, News..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors resize-none custom-scrollbar"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`mt-4 w-full font-bold py-3 rounded-xl transition-all duration-300 ${isSubmitting ? 'bg-gunmetal-700 text-gray-500 cursor-not-allowed' : 'bg-target text-black hover:shadow-[0_0_20px_rgba(0,200,5,0.3)] hover:scale-[1.02] active:scale-[0.98]'}`}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Trade'}
                                </button>
                            </form>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
