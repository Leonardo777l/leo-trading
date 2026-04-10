'use client';

import { useMemo, useState } from 'react';
import { useTradeStore } from '@/store/useTradeStore';
import { Database, Plus, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatabaseSwitcherProps {
    variant?: 'sidebar' | 'header';
}

export const DatabaseSwitcher = ({ variant = 'sidebar' }: DatabaseSwitcherProps) => {
    const { trades, selectedStrategy, setSelectedStrategy } = useTradeStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newDbName, setNewDbName] = useState('');

    const availableDatabases = ['ORDER FLOW 1:3', 'ORDER FLOW 1.5', 'RR NEGATIVO'];

    return (
        <div className="relative group/switcher">
            {variant === 'sidebar' ? (
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
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-gunmetal-900 border border-gunmetal-700 px-3 py-1.5 rounded-full hover:border-target/50 transition-all cursor-pointer group"
                >
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-300">
                        ACTIVE DATABASE:
                    </span>
                    <span className="text-[11px] font-black text-target uppercase tracking-wider flex items-center gap-1.5">
                        {selectedStrategy}
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-[1px]"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: variant === 'sidebar' ? 0 : 10, x: variant === 'sidebar' ? -10 : 0, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                            exit={{ opacity: 0, y: variant === 'sidebar' ? 0 : 10, x: variant === 'sidebar' ? -10 : 0, scale: 0.95 }}
                            className={`absolute z-[110] min-w-[220px] bg-gunmetal-900 border border-gunmetal-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 ${
                                variant === 'sidebar' ? 'left-16 top-0' : 'right-0 top-full mt-2'
                            }`}
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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
