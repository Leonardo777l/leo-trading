'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Play, 
    CheckCircle2, 
    XCircle, 
    RotateCcw, 
    Settings2, 
    TrendingUp, 
    History,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Status = 'IDLE' | 'OPERANDO' | 'TARGET' | 'STOP' | 'DRAWDOWN_HIT';
type Mode = 'Normal' | 'Agresivo';

interface Level {
    id: number;
    risk: number;
    target: number;
    recoveryRequired: number;
}

interface HistoryItem {
    id: string;
    level: number;
    risk: number;
    result: 'TARGET' | 'STOP';
    timestamp: Date;
}

export const RiskCalculator = () => {
    // Configuration
    const [accountSize, setAccountSize] = useState(50000);
    const [maxDrawdown, setMaxDrawdown] = useState(2000);
    const [mode, setMode] = useState<Mode>('Normal');

    // Operational State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [accumulatedLoss, setAccumulatedLoss] = useState(0);
    const [status, setStatus] = useState<Status>('IDLE');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [flashEffect, setFlashEffect] = useState<Status | null>(null);

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('trading_risk_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setAccountSize(parsed.accountSize || 50000);
                setMaxDrawdown(parsed.maxDrawdown || 2000);
                setMode(parsed.mode || 'Normal');
                setCurrentLevel(parsed.currentLevel || 1);
                setAccumulatedLoss(parsed.accumulatedLoss || 0);
                setHistory(parsed.history || []);
            } catch (e) {
                console.error('Failed to load risk state', e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        const state = {
            accountSize,
            maxDrawdown,
            mode,
            currentLevel,
            accumulatedLoss,
            history
        };
        localStorage.setItem('trading_risk_state', JSON.stringify(state));
    }, [accountSize, maxDrawdown, mode, currentLevel, accumulatedLoss, history]);

    // Risk Tables
    const levels: Level[] = useMemo(() => {
        if (mode === 'Normal') {
            return [
                { id: 1, risk: 100, target: 150, recoveryRequired: 0 },
                { id: 2, risk: 125, target: 187.5, recoveryRequired: 100 },
                { id: 3, risk: 175, target: 262.5, recoveryRequired: 225 },
                { id: 4, risk: 250, target: 375, recoveryRequired: 400 },
                { id: 5, risk: 350, target: 525, recoveryRequired: 650 },
                { id: 6, risk: 500, target: 750, recoveryRequired: 1000 },
                { id: 7, risk: 750, target: 1125, recoveryRequired: 1500 },
                { id: 8, risk: 1000, target: 1500, recoveryRequired: 2250 },
            ];
        } else {
            // Aggressive Mode (5 Shots) - Proposed to sum up to ~2000
            return [
                { id: 1, risk: 200, target: 300, recoveryRequired: 0 },
                { id: 2, risk: 250, target: 375, recoveryRequired: 200 },
                { id: 3, risk: 350, target: 525, recoveryRequired: 450 },
                { id: 4, risk: 500, target: 750, recoveryRequired: 800 },
                { id: 5, risk: 700, target: 1050, recoveryRequired: 1300 },
            ];
        }
    }, [mode]);

    const currentLevelData = levels.find(l => l.id === currentLevel) || levels[0];
    const totalMaxShots = levels.length;

    // Actions
    const openTrade = () => {
        if (status === 'DRAWDOWN_HIT') return;
        setStatus('OPERANDO');
    };

    const handleTarget = () => {
        const newItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            level: currentLevel,
            risk: currentLevelData.risk,
            result: 'TARGET',
            timestamp: new Date(),
        };

        setHistory([newItem, ...history]);
        setFlashEffect('TARGET');
        setAccumulatedLoss(0);
        setCurrentLevel(1);
        setStatus('IDLE');

        setTimeout(() => setFlashEffect(null), 1000);
    };

    const handleStop = () => {
        const newItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            level: currentLevel,
            risk: currentLevelData.risk,
            result: 'STOP',
            timestamp: new Date(),
        };

        const newAccLoss = accumulatedLoss + currentLevelData.risk;
        setHistory([newItem, ...history]);
        setFlashEffect('STOP');
        setAccumulatedLoss(newAccLoss);

        if (currentLevel < totalMaxShots) {
            setCurrentLevel(currentLevel + 1);
            setStatus('IDLE');
        } else {
            setStatus('DRAWDOWN_HIT');
        }

        setTimeout(() => setFlashEffect(null), 1000);
    };

    const resetSession = () => {
        if (window.confirm('¿Reiniciar toda la sesión a Nivel 1?')) {
            setCurrentLevel(1);
            setAccumulatedLoss(0);
            setStatus('IDLE');
            setHistory([]);
        }
    };

    const drawdownProgress = (accumulatedLoss / maxDrawdown) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
            
            {/* Main Stats & Status */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Status Card */}
                <motion.div 
                    layout
                    className={`relative overflow-hidden rounded-3xl border transition-all duration-500 p-8 ${
                        status === 'OPERANDO' 
                            ? 'bg-breakeven/20 border-breakeven shadow-[0_0_30px_rgba(255,191,0,0.2)]' 
                            : status === 'DRAWDOWN_HIT'
                                ? 'bg-stop/20 border-stop animate-pulse'
                                : 'bg-gunmetal-900 border-gunmetal-700'
                    }`}
                >
                    {/* Visual Flash Effect Overlay */}
                    <AnimatePresence>
                        {flashEffect === 'TARGET' && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 0.3 }} 
                                exit={{ opacity: 0 }} 
                                className="absolute inset-0 bg-target z-10"
                            />
                        )}
                        {flashEffect === 'STOP' && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 0.3 }} 
                                exit={{ opacity: 0 }} 
                                className="absolute inset-0 bg-stop z-10"
                            />
                        )}
                    </AnimatePresence>

                    <div className="relative z-20 flex flex-col items-center justify-center text-center gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase">Estado Actual</span>
                            <div className="flex items-center gap-3">
                                {status === 'IDLE' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                                {status === 'OPERANDO' && <div className="w-3 h-3 rounded-full bg-breakeven animate-ping shadow-[0_0_10px_#FFBF00]" />}
                                {status === 'DRAWDOWN_HIT' && <AlertTriangle className="w-5 h-5 text-stop" />}
                                <h2 className={`text-4xl font-black tracking-tighter ${
                                    status === 'OPERANDO' ? 'text-breakeven' : 
                                    status === 'DRAWDOWN_HIT' ? 'text-stop' : 'text-white'
                                }`}>
                                    {status === 'IDLE' ? 'PREPARADO' : 
                                     status === 'OPERANDO' ? 'TRADE ACTIVO' : 
                                     status === 'DRAWDOWN_HIT' ? 'CRITICAL - DD HIT' : 'RESULTADO'}
                                </h2>
                            </div>
                        </div>

                        {status === 'IDLE' && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                                    <div className="grid grid-cols-2 gap-8 min-w-[300px]">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Arriesgar</p>
                                            <p className="text-3xl font-black text-white">${currentLevelData.risk}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Target</p>
                                            <p className="text-3xl font-black text-target">${currentLevelData.target}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={openTrade}
                                    className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    ABRIR OPERACIÓN
                                </button>
                            </div>
                        )}

                        {status === 'OPERANDO' && (
                            <div className="flex gap-4 w-full max-w-md">
                                <button 
                                    onClick={handleTarget}
                                    className="flex-1 flex flex-col items-center gap-2 bg-target text-black px-6 py-8 rounded-3xl font-black text-xl hover:shadow-[0_0_40px_rgba(0,200,5,0.4)] transition-all"
                                >
                                    <CheckCircle2 className="w-8 h-8" />
                                    TARGET (+${currentLevelData.target})
                                </button>
                                <button 
                                    onClick={handleStop}
                                    className="flex-1 flex flex-col items-center gap-2 bg-stop text-white px-6 py-8 rounded-3xl font-black text-xl hover:shadow-[0_0_40px_rgba(255,0,50,0.4)] transition-all"
                                >
                                    <XCircle className="w-8 h-8" />
                                    STOP (-${currentLevelData.risk})
                                </button>
                            </div>
                        )}

                        {status === 'DRAWDOWN_HIT' && (
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-gray-400 font-medium">Límite de Drawdown alcanzado. Se requiere reinicio manual.</p>
                                <button 
                                    onClick={resetSession}
                                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    REINICIAR CUENTA
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Progress Card */}
                <div className="bg-gunmetal-900 border border-gunmetal-700 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Drawdown Progress</span>
                        </div>
                        <span className={`text-xs font-black ${drawdownProgress > 80 ? 'text-stop' : 'text-white'}`}>
                            ${accumulatedLoss.toFixed(0)} / ${maxDrawdown.toFixed(0)} ({drawdownProgress.toFixed(1)}%)
                        </span>
                    </div>
                    <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${drawdownProgress}%` }}
                            className={`h-full relative ${
                                drawdownProgress > 75 ? 'bg-stop shadow-[0_0_15px_#FF0032]' : 
                                drawdownProgress > 40 ? 'bg-breakeven shadow-[0_0_15px_#FFBF00]' : 'bg-blue-500 shadow-[0_0_15px_#3b82f6]'
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        </motion.div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Pérdida Acumulada</p>
                            <p className="text-xl font-black text-stop">-${accumulatedLoss}</p>
                        </div>
                        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Target de Recuperación</p>
                            <p className="text-xl font-black text-target">+${currentLevelData.target}</p>
                        </div>
                    </div>
                </div>

                {/* Risk Table (Visible on large screens) */}
                <div className="bg-gunmetal-900 border border-gunmetal-700 rounded-3xl overflow-hidden hidden md:block">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-300">Hoja de Ruta - Modo {mode}</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-target" />
                                <span className="text-[9px] font-bold text-gray-500 uppercase">RR 1:1.5</span>
                            </div>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-500 border-b border-white/5 uppercase">
                                <th className="px-6 py-4">Nivel</th>
                                <th className="px-6 py-4">Riesgo ($)</th>
                                <th className="px-6 py-4">Target ($)</th>
                                <th className="px-6 py-4">Recup. Necesaria</th>
                                <th className="px-6 py-4 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {levels.map((lvl) => {
                                const isCurrent = lvl.id === currentLevel;
                                const isPast = lvl.id < currentLevel;
                                return (
                                    <tr 
                                        key={lvl.id}
                                        className={`transition-all duration-300 ${
                                            isCurrent ? 'bg-white/10 text-white' : 
                                            isPast ? 'opacity-20 text-gray-500' : 'text-gray-400'
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                                    isCurrent ? 'bg-white text-black' : 'bg-white/5 text-gray-500'
                                                }`}>
                                                    {lvl.id}
                                                </span>
                                                Tiro {lvl.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-stop">${lvl.risk}</td>
                                        <td className="px-6 py-4 font-bold text-target">${lvl.target}</td>
                                        <td className="px-6 py-4 text-[11px] font-medium">${lvl.recoveryRequired}</td>
                                        <td className="px-6 py-4 text-right">
                                            {isCurrent && (
                                                <span className="bg-breakeven/20 text-breakeven text-[10px] font-black px-2 py-1 rounded">
                                                    ACTUAL
                                                </span>
                                            )}
                                            {isPast && (
                                                <span className="text-gray-600 italic text-[10px]">Perdido</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sidebar Controls & History */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Settings Panel */}
                <div className="bg-gunmetal-900 border border-gunmetal-700 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-white">Configuración</h3>
                        </div>
                        <button 
                            onClick={resetSession}
                            className="p-2 hover:bg-white/5 rounded-xl transition-all"
                            title="Reset Session"
                        >
                            <RotateCcw className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase">Modo de Agresividad</label>
                            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                                <button 
                                    onClick={() => setMode('Normal')}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                                        mode === 'Normal' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
                                    }`}
                                >
                                    NORMAL (8)
                                </button>
                                <button 
                                    onClick={() => setMode('Agresivo')}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                                        mode === 'Agresivo' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
                                    }`}
                                >
                                    AGRESIVO (5)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Tamaño de Cuenta</label>
                                    <span className="text-[10px] font-bold text-white">${accountSize.toLocaleString()}</span>
                                </div>
                                <input 
                                    type="range" min="1000" max="300000" step="1000"
                                    value={accountSize}
                                    onChange={(e) => setAccountSize(Number(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Max Drawdown</label>
                                    <span className="text-[10px] font-bold text-white">${maxDrawdown.toLocaleString()}</span>
                                </div>
                                <input 
                                    type="range" min="100" max="10000" step="100"
                                    value={maxDrawdown}
                                    onChange={(e) => setMaxDrawdown(Number(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Panel */}
                <div className="bg-gunmetal-900 border border-gunmetal-700 rounded-3xl flex flex-col flex-1 min-h-[400px]">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-white">Historial de Sesión</h3>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[600px]">
                        <AnimatePresence initial={false}>
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                    <History className="w-8 h-8 opacity-20 mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Sin trades aún</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((item) => (
                                        <motion.div 
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.result === 'TARGET' ? 'bg-target' : 'bg-stop'}`} />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                        Tiro {item.level} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-black text-white">
                                                    {item.result === 'TARGET' ? 'RECUPERADO' : 'FALLIDO'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${item.result === 'TARGET' ? 'text-target' : 'text-stop'}`}>
                                                    {item.result === 'TARGET' ? `+$${(item.risk * 1.5).toFixed(0)}` : `-$${item.risk}`}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {history.length > 0 && (
                        <div className="p-4 border-t border-white/5 bg-white/5 text-center">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tabular-nums">
                                TOTAL SESIÓN: <span className={accumulatedLoss > 0 ? 'text-stop' : 'text-target'}>
                                    ${(history.reduce((acc, curr) => acc + (curr.result === 'TARGET' ? curr.risk * 1.5 : -curr.risk), 0)).toFixed(0)}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Shimmer CSS for custom animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite linear;
                }
            `}</style>
        </div>
    );
};
