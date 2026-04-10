'use client';

import { useState } from 'react';
import { Target, AlertOctagon, TrendingDown, DollarSign, ListChecks, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';
import { useBitacoraStore, ShotOutcome } from '@/store/useBitacoraStore';

export default function RulesPage() {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    
    const { shots, addShot, updateShot, deleteShot, resetShots } = useBitacoraStore();

    // Account constraints based on user specs
    const initialBal = 49604.71;
    const initialMll = 48146.37;
    const riskPerEntry = 150;
    const initialDrawdownRoom = initialBal - initialMll;

    // We can compute current hypothetical balance based on the shots
    // Assuming a Target = +150 (or similar risk-reward maybe +225 for 1:1.5? but let's stick to base risk units for now or just generic target)
    // To be safer and keep it simple, we just use the raw count. 
    const targetsCount = shots.filter(s => s.outcome === 'target').length;
    const stopsCount = shots.filter(s => s.outcome === 'stop').length;

    // Optional hypothetical progression if we assume RR 1:1.5 
    const assumedWinAmount = riskPerEntry * 1.5;
    const assumedLossAmount = riskPerEntry;
    
    // Net profit from logged shots
    const netProfitLogged = (targetsCount * assumedWinAmount) - (stopsCount * assumedLossAmount);

    const displayBal = initialBal + netProfitLogged;
    // MLL (Trailing or Static?) TopStep trails positively until 50k but let's assume it's static for the simplicity of the visual 
    // unless balance creates a new threshold, for now just show MLL static or moving with balance max.
    const highestBal = Math.max(initialBal, displayBal);
    // If it's a trailing drawdown from HWM max of $2000 loss
    const displayMll = Math.max(initialMll, highestBal - 2000); 

    const currentDrawdownRoom = displayBal - displayMll;
    // Maximum allowable difference from MLL = $2000
    const healthPercent = Math.max(0, Math.min(100, (currentDrawdownRoom / 2000) * 100));

    return (
        <>
            <DashboardLayout
                onQuickAdd={() => setIsQuickAddOpen(true)}
            >
                <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                REGLAS Y DE LA CUENTA
                            </h1>
                            <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                                Parámetros fijos y Bitácora de Operación
                            </p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                        
                        {/* COLUMNA 1: REGLAS FIJAS TOPSTEP */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-gunmetal-900 border border-gunmetal-700 p-6 md:p-8 rounded-[2rem] relative shadow-2xl flex flex-col h-full">
                                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                    Reglas 50k TopStep
                                </h2>
                                
                                <div className="space-y-4 flex-1">
                                    {/* Regla 1: Drawdown */}
                                    <div className="bg-gunmetal-800/80 p-5 rounded-2xl border border-gunmetal-700 flex gap-4 items-center">
                                        <div className="bg-red-500/10 p-3 rounded-xl shrink-0">
                                            <TrendingDown className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Drawdown Máximo</p>
                                            <p className="text-xl font-black text-white">$2,000.00</p>
                                        </div>
                                    </div>

                                    {/* Regla 2: Riesgo por entrada */}
                                    <div className="bg-gunmetal-800/80 p-5 rounded-2xl border border-gunmetal-700 flex gap-4 items-center">
                                        <div className="bg-blue-500/10 p-3 rounded-xl shrink-0">
                                            <DollarSign className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Riesgo por Entrada</p>
                                            <p className="text-xl font-black text-white">$150.00</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Max Tiros</p>
                                            <p className="text-lg font-black text-blue-400 font-mono">~13</p>
                                        </div>
                                    </div>

                                    {/* Regla 3: Stops Diarios */}
                                    <div className="bg-gunmetal-800/80 p-5 rounded-2xl border border-gunmetal-700 flex gap-4 items-center">
                                        <div className="bg-stop/10 p-3 rounded-xl shrink-0">
                                            <AlertOctagon className="w-6 h-6 text-stop" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Límite Diario</p>
                                            <p className="text-lg font-bold text-white">2 Stop Loss</p>
                                            <p className="text-xs text-gray-500 mt-1">Si pierdes 2, se apaga la pantalla.</p>
                                        </div>
                                    </div>

                                    {/* Regla 4: Targets Diarios */}
                                    <div className="bg-gunmetal-800/80 p-5 rounded-2xl border border-gunmetal-700 flex gap-4 items-center">
                                        <div className="bg-target/10 p-3 rounded-xl shrink-0">
                                            <Target className="w-6 h-6 text-target" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Meta Diaria</p>
                                            <p className="text-lg font-bold text-white">2 Targets</p>
                                            <p className="text-xs text-gray-500 mt-1">Cobra ganancias y descansa.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA 2: BITÁCORA Y GRÁFICO */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <div className="bg-gunmetal-900 border border-gunmetal-700 p-6 md:p-8 rounded-[2rem] relative shadow-2xl flex flex-col h-full overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <span className="w-2 h-8 bg-target rounded-full"></span>
                                        Bitácora de Desarrollo
                                    </h2>
                                    {shots.length > 0 && (
                                        <button 
                                            onClick={resetShots}
                                            className="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1 bg-gunmetal-800 px-3 py-1.5 rounded-lg border border-gunmetal-700"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            LIMPIAR HISTORIAL
                                        </button>
                                    )}
                                </div>

                                {/* DASHBOARD DE CUENTA */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gunmetal-950/50 border border-gunmetal-800 p-5 rounded-2xl flex flex-col">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Balance Actual (Est.)</p>
                                        <p className="text-3xl font-black text-white font-mono">
                                            ${displayBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="bg-gunmetal-950/50 border border-gunmetal-800 p-5 rounded-2xl flex flex-col">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Max Loss Limit (MLL)</p>
                                        <p className="text-3xl font-black text-red-500/80 font-mono">
                                            ${displayMll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                {/* BARRA DE SALUD (DRAWDOWN) */}
                                <div className="mb-8">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-400 uppercase tracking-widest">Colchón Disponible</span>
                                        <span className={currentDrawdownRoom > 500 ? 'text-target' : 'text-red-500'}>
                                            ${currentDrawdownRoom.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="h-4 w-full bg-gunmetal-950 rounded-full overflow-hidden border border-gunmetal-700/50 p-0.5">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-700 ease-out ${healthPercent > 50 ? 'bg-target' : healthPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${healthPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-right">
                                        Max permitido: $2,000.00
                                    </p>
                                </div>

                                {/* LISTA DE TIROS (CHECKLIST) */}
                                <div className="flex-1 flex flex-col mt-4 border-t border-gunmetal-800/50 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <ListChecks className="w-4 h-4" />
                                            Registro de Tiros
                                        </h3>
                                        <button
                                            onClick={() => addShot(null)}
                                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors"
                                        >
                                            + NUEVO TIRO
                                        </button>
                                    </div>

                                    <div className="space-y-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                                        {shots.length === 0 ? (
                                            <div className="text-center py-10 border border-dashed border-gunmetal-700 rounded-2xl opacity-60">
                                                <Target className="w-10 h-10 text-gray-500 mx-auto mb-3 opacity-50" />
                                                <p className="text-sm text-gray-400 font-medium">No hay tiros registrados.</p>
                                                <p className="text-xs text-gray-500">Haz clic en '+ NUEVO TIRO' para empezar la bitácora.</p>
                                            </div>
                                        ) : (
                                            shots.map((shot, index) => (
                                                <div key={shot.id} className="flex items-center justify-between bg-gunmetal-950/40 p-3 rounded-xl border border-gunmetal-800/80 group">
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-mono text-gray-600 font-black text-sm w-6">
                                                            #{index + 1}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => updateShot(shot.id, 'target')}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                                    shot.outcome === 'target' 
                                                                    ? 'bg-target/20 text-target border-target/50 shadow-[0_0_10px_rgba(var(--color-target-rgb),0.2)]'
                                                                    : 'bg-gunmetal-800/50 text-gray-500 border-transparent hover:bg-target/10 hover:text-target/70'
                                                                }`}
                                                            >
                                                                <ArrowUpCircle className="w-4 h-4" />
                                                                TARGET
                                                            </button>
                                                            <button 
                                                                onClick={() => updateShot(shot.id, 'stop')}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                                    shot.outcome === 'stop' 
                                                                    ? 'bg-stop/20 text-stop border-stop/50 shadow-[0_0_10px_rgba(var(--color-stop-rgb),0.2)]'
                                                                    : 'bg-gunmetal-800/50 text-gray-500 border-transparent hover:bg-stop/10 hover:text-stop/70'
                                                                }`}
                                                            >
                                                                <ArrowDownCircle className="w-4 h-4" />
                                                                STOP
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => deleteShot(shot.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                        title="Eliminar tiro"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                
                            </div>
                        </div>

                    </div>
                </div>
            </DashboardLayout>

            <QuickAddTrade
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
            />
        </>
    );
}
