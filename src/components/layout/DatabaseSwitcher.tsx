'use client';

import { useMemo, useState } from 'react';
import { useTradeStore } from '@/store/useTradeStore';
import { Database, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DatabaseSwitcher = () => {
    const { trades, selectedStrategy, setSelectedStrategy } = useTradeStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newDbName, setNewDbName] = useState('');

    const availableDatabases = useMemo(() => {
        const strats = trades.map(t => t.strategy ? t.strategy.trim() : 'Order Flow');
        const unique = Array.from(new Set(strats));
        if (!unique.includes('Order Flow')) unique.push('Order Flow');
        return unique.sort();
    }, [trades]);

    const handleCreate = () => {
        if (newDbName.trim()) {
            setSelectedStrategy(newDbName.trim());
            setNewDbName('');
            setIsCreating(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative group/switcher">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 border ${
                    isOpen 
                    ? 'bg-gunmetal-800 border-target text-target' 
                    : 'bg-gunmetal-900 border-gunmetal-700 text-gray-500 hover:text-white hover:border-gray-500'
                }`}
                title="Switch Database"
            >
                <Database className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                            className="absolute left-16 top-0 z-50 min-w-[200px] bg-gunmetal-900 border border-gunmetal-700 rounded-xl shadow-2xl p-2"
                        >
                            <div className="px-3 py-2 border-b border-gunmetal-700 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    Independent Databases
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <button
                                    onClick={() => { setSelectedStrategy('ALL'); setIsOpen(false); }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                        selectedStrategy === 'ALL' 
                                        ? 'bg-target/10 text-target' 
                                        : 'text-gray-400 hover:bg-gunmetal-800 hover:text-white'
                                    }`}
                                >
                                    <span>ALL STRATEGIES (GLOBAL)</span>
                                    {selectedStrategy === 'ALL' && <Check className="w-3 h-3" />}
                                </button>

                                {availableDatabases.map(db => (
                                    <button
                                        key={db}
                                        onClick={() => { setSelectedStrategy(db); setIsOpen(false); }}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                            selectedStrategy === db 
                                            ? 'bg-target/20 text-target border border-target/20' 
                                            : 'text-gray-400 hover:bg-gunmetal-800 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedStrategy === db ? 'bg-target' : 'bg-gray-700'}`} />
                                            <span>{db.toUpperCase()}</span>
                                        </div>
                                        {selectedStrategy === db && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-2 pt-2 border-t border-gunmetal-700">
                                {isCreating ? (
                                    <div className="flex flex-col gap-2 p-1">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="DATABASE NAME..."
                                            value={newDbName}
                                            onChange={(e) => setNewDbName(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                            className="w-full bg-black border border-gunmetal-600 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-target"
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleCreate}
                                                className="flex-1 bg-target text-black text-[10px] font-black py-1 rounded hover:scale-105 transition-transform"
                                            >
                                                CREATE
                                            </button>
                                            <button 
                                                onClick={() => setIsCreating(false)}
                                                className="flex-1 bg-gunmetal-800 text-gray-400 text-[10px] font-black py-1 rounded hover:bg-gunmetal-700"
                                            >
                                                CANCEL
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-500 hover:text-target hover:bg-target/5 rounded-lg transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>NEW DATABASE</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
