'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTradeStore, Direction, Outcome } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';

interface QuickAddTradeProps {
    isOpen: boolean;
    onClose: () => void;
    defaultAccount?: string;
}

export const QuickAddTrade = ({ isOpen, onClose, defaultAccount }: QuickAddTradeProps) => {
    const addTrade = useTradeStore(state => state.addTrade);
    const selectedStrategy = useTradeStore(state => state.selectedStrategy);
    const setSelectedStrategy = useTradeStore(state => state.setSelectedStrategy); 
    const trades = useTradeStore(state => state.trades);

    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [direction, setDirection] = useState<Direction>('Long');
    const [outcome, setOutcome] = useState<Outcome>('TP');
    const [targetPointsInput, setTargetPointsInput] = useState<number | ''>('');
    const [stopPointsInput, setStopPointsInput] = useState<number | ''>('');
    const [imageLink, setImageLink] = useState('');
    const account = defaultAccount || 'PERSONAL';
    const [instrument, setInstrument] = useState('MNQ');
    const [strategy, setStrategy] = useState(selectedStrategy === 'ALL' ? 'Order Flow' : selectedStrategy);
    const [notes, setNotes] = useState('');
    const [isNewStrategy, setIsNewStrategy] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeStrategies = useMemo(() => {
        const strats = trades.map(t => t.strategy ? t.strategy.trim() : 'Order Flow');
        const unique = Array.from(new Set(strats));
        if (!unique.includes('Order Flow')) unique.push('Order Flow');
        return unique.sort();
    }, [trades]);

    const getInstrumentInfo = (inst: string) => {
        switch (inst.toUpperCase()) {
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

    const calculatedTicksTarget = targetPointsInput ? Math.round(Number(targetPointsInput) * ticksPerPoint) : 0;
    const calculatedStopTicks = stopPointsInput ? Math.round(Number(stopPointsInput) * ticksPerPoint) : 0;
    
    let calculatedContracts = 1;
    if (calculatedStopTicks > 0) {
        calculatedContracts = Math.round(500 / (calculatedStopTicks * tickValue));
        if (calculatedContracts < 1) calculatedContracts = 1;
    }

    const targetPoints = Number(targetPointsInput) || 0;
    const stopPoints = Number(stopPointsInput) || 0;

    const totalComm = calculatedContracts * comm;
    
    let estimatedPnL = 0;
    const s = strategy.toUpperCase();
    if (s.includes('RR NEGATIVO')) {
        estimatedPnL = outcome === 'TP' ? 350 : outcome === 'SL' ? -500 : 0;
    } else if (s.includes('ORDER FLOW 1.5') || s.includes('1:1.5')) {
        estimatedPnL = outcome === 'TP' ? 750 : outcome === 'SL' ? -500 : 0;
    } else if (s.includes('ORDER FLOW')) {
        estimatedPnL = outcome === 'TP' ? 1500 : outcome === 'SL' ? -500 : 0;
    } else {
        estimatedPnL = outcome === 'TP' 
            ? (calculatedTicksTarget * tickValue * calculatedContracts) - totalComm 
            : outcome === 'SL' 
                ? -(calculatedStopTicks * tickValue * calculatedContracts) - totalComm 
                : -totalComm;
    }

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
                contracts: calculatedContracts,
                estadoMental: 'Calm',
                imageLink,
                account,
                instrument,
                notes,
                strategy
            });
            
            setIsSubmitting(false);
            onClose();
            setTargetPointsInput('');
            setStopPointsInput('');
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Target (Puntos)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.25"
                                            value={targetPointsInput}
                                            onChange={(e) => setTargetPointsInput(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="e.g. 25"
                                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Stop (Puntos)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.25"
                                            value={stopPointsInput}
                                            onChange={(e) => setStopPointsInput(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="e.g. 8.25"
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
                                        <div className="flex justify-between items-center text-sm col-span-2 pt-1 border-t border-gunmetal-800">
                                            <span className="text-gray-500 font-bold">Rec. Contracts (-$500 Risk):</span>
                                            <span className="text-blue-400 font-mono font-bold text-lg">{calculatedContracts}</span>
                                        </div>
                                    </div>
                                </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Instrument Section */}
                                        <div className="flex flex-col gap-1.5 text-left">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Instrument</label>
                                            <select
                                                value={instrument}
                                                onChange={(e) => setInstrument(e.target.value)}
                                                className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors cursor-pointer"
                                            >
                                                <option value="MNQ">MNQ (Micro Nasdaq)</option>
                                                <option value="ES">ES (S&P 500)</option>
                                                <option value="MES">MES (Micro S&P)</option>
                                                <option value="CL">CL (Crude Oil)</option>
                                                <option value="GC">GC (Gold)</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>

                                        {/* Strategy Section - Independent Workspaces */}
                                        <div className="flex flex-col gap-1.5 text-left">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Strategy / Workspace</label>
                                            {isNewStrategy ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="NEW WORKSPACE NAME"
                                                        value={strategy}
                                                        onChange={(e) => {
                                                            const val = e.target.value.toUpperCase();
                                                            setStrategy(val);
                                                            // Link it to global workspace selection
                                                            setSelectedStrategy(val);
                                                        }}
                                                        className="w-full bg-target/5 border border-target/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-target/50 transition-colors font-bold"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsNewStrategy(false);
                                                            const prev = selectedStrategy === 'ALL' ? 'Order Flow' : selectedStrategy;
                                                            setStrategy(prev);
                                                        }}
                                                        className="px-3 bg-gunmetal-800 border border-gunmetal-700 hover:bg-gunmetal-700 rounded-lg text-gray-400 transition-colors flex items-center justify-center shrink-0"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={activeStrategies.includes(strategy) ? strategy : 'Order Flow'}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'NEW') {
                                                            setStrategy('');
                                                            setIsNewStrategy(true);
                                                        } else {
                                                            setStrategy(e.target.value);
                                                            setSelectedStrategy(e.target.value);
                                                        }
                                                    }}
                                                    className={`bg-gunmetal-800 border border-gunmetal-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-target/50 transition-colors cursor-pointer font-bold ${strategy === 'ORDER FLOW 1.5' || strategy === 'RR NEGATIVO' ? 'text-target' : 'text-white'}`}
                                                >
                                                    {activeStrategies.map(strat => (
                                                        <option key={strat} value={strat}>{strat.toUpperCase()}</option>
                                                    ))}
                                                    <option value="NEW" className="text-target font-black">+ CREATE NEW WORKSPACE</option>
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
