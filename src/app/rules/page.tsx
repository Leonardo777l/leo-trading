'use client';

import { useState } from 'react';
import { Target, AlertOctagon, TrendingDown, DollarSign, ListChecks, ArrowDownCircle, ArrowUpCircle, Trash2, Trophy, Skull, Plus, Wallet, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';
import { useBitacoraStore } from '@/store/useBitacoraStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

export default function RulesPage() {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    
    const { 
        accounts, 
        activeAccountId, 
        addAccount, 
        setActiveAccount, 
        updateAccountStatus, 
        deleteAccount,
        addShotToActive, 
        updateShotInActive, 
        deleteShotFromActive, 
        resetShotsInActive 
    } = useBitacoraStore();

    const activeAccount = accounts.find(a => a.id === activeAccountId);
    const shots = activeAccount ? activeAccount.shots : [];

    // History Stats
    const passedCount = accounts.filter(a => a.status === 'passed').length;
    const failedCount = accounts.filter(a => a.status === 'failed').length;
    const activeCount = accounts.filter(a => a.status === 'active').length;

    // Fixed TopStep Specs for calculations based on selected account 
    // We assume size 50k for now since it's hardcoded to that in the add function (we could add a selector later)
    const initialBal = activeAccount ? activeAccount.size : 50000;
    // MLL calculation can be approximated or static for this visual dashboard.
    // For a 50k account, max drawdown is 2000, so MLL initially is 48000.
    // In the user's specific previous image it was: 49604.71 vs 48146.37 (this trails).
    // To generalize it for any new 50k account: Initial Bal 50000, Initial MLL 48000.
    const initialMll = initialBal - 2000; 
    const riskPerEntry = 150;

    const targetsCount = shots.filter(s => s.outcome === 'target').length;
    const stopsCount = shots.filter(s => s.outcome === 'stop').length;
    
    // Abstract static assumed R:R 1:1.5 
    const assumedWinAmount = riskPerEntry * 1.5;
    const assumedLossAmount = riskPerEntry;
    
    const netProfitLogged = (targetsCount * assumedWinAmount) - (stopsCount * assumedLossAmount);

    const displayBal = initialBal + netProfitLogged;
    // Basic static MLL tracking for visual
    const displayMll = initialMll; 
    const passTarget = initialBal + 3000;

    const currentDrawdownRoom = displayBal - displayMll;
    const healthPercent = Math.max(0, Math.min(100, (currentDrawdownRoom / 2000) * 100));
    
    const currentProfit = displayBal - initialBal;
    const progressPercent = Math.max(0, Math.min(100, (currentProfit / 3000) * 100));

    // Stats
    const winRate = shots.length > 0 ? (targetsCount / shots.length) * 100 : 0;
    
    let currentStreak = 0;
    let isWinStreak = true;
    for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i];
        if (s.outcome === null) continue;
        if (currentStreak === 0) {
            isWinStreak = s.outcome === 'target';
            currentStreak = 1;
        } else {
            if ((isWinStreak && s.outcome === 'target') || (!isWinStreak && s.outcome === 'stop')) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Chart Data
    // We recreate the balance curve point by point
    const chartData = [ { shot: 0, balance: initialBal } ];
    let runningBalance = initialBal;
    shots.forEach((s, i) => {
        if (s.outcome === 'target') runningBalance += assumedWinAmount;
        else if (s.outcome === 'stop') runningBalance -= assumedLossAmount;
        chartData.push({ shot: i + 1, balance: runningBalance });
    });

    const handleAddAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAccountName.trim()) return;
        addAccount(newAccountName.trim(), 50000);
        setNewAccountName('');
        setIsAddingAccount(false);
    };

    const isReadOnly = activeAccount?.status === 'passed' || activeAccount?.status === 'failed';

    return (
        <>
            <DashboardLayout
                onQuickAdd={() => setIsQuickAddOpen(true)}
            >
                <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                CAZA DE FONDEOS
                            </h1>
                            <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                                Gestión de Cuentas, Bitácora y Reglas Estrictas
                            </p>
                        </div>
                    </header>

                    {/* METRICS ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div className="bg-gunmetal-900 border border-gunmetal-700/50 p-4 rounded-2xl flex items-center gap-4">
                            <div className="bg-blue-500/10 p-3 rounded-xl">
                                <Wallet className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Activas</p>
                                <p className="text-2xl font-black text-white">{activeCount}</p>
                            </div>
                        </div>
                        <div className="bg-gunmetal-900 border border-target/20 p-4 rounded-2xl flex items-center gap-4 shadow-[0_0_15px_rgba(var(--color-target-rgb),0.05)]">
                            <div className="bg-target/20 p-3 rounded-xl border border-target/30">
                                <Trophy className="w-5 h-5 text-target" />
                            </div>
                            <div>
                                <p className="text-xs text-target/80 font-bold uppercase tracking-wider">Aprobadas</p>
                                <p className="text-2xl font-black text-white">{passedCount}</p>
                            </div>
                        </div>
                        <div className="bg-gunmetal-900 border border-stop/20 p-4 rounded-2xl flex items-center gap-4 shadow-[0_0_15px_rgba(var(--color-stop-rgb),0.05)]">
                            <div className="bg-stop/20 p-3 rounded-xl border border-stop/30">
                                <Skull className="w-5 h-5 text-stop" />
                            </div>
                            <div>
                                <p className="text-xs text-stop/80 font-bold uppercase tracking-wider">Quemadas</p>
                                <p className="text-2xl font-black text-white">{failedCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                        
                        {/* COLUMNA 1: REGLAS FIJAS TOPSTEP */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-gunmetal-900 border border-gunmetal-700 p-6 md:p-8 rounded-[2rem] relative shadow-2xl flex flex-col h-full">
                                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                    Reglas 50k TopStep
                                </h2>
                                
                                <div className="space-y-4 flex-1">
                                    <div className="bg-gunmetal-800/80 p-5 rounded-2xl border border-gunmetal-700 flex gap-4 items-center">
                                        <div className="bg-red-500/10 p-3 rounded-xl shrink-0">
                                            <TrendingDown className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Drawdown Máximo</p>
                                            <p className="text-xl font-black text-white">$2,000.00</p>
                                        </div>
                                    </div>
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
                            <div className="bg-gunmetal-900 border border-gunmetal-700 p-6 md:p-8 rounded-[2rem] relative shadow-2xl flex flex-col h-full overflow-hidden min-h-[600px]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                                
                                {/* HEADER Y SELECTOR DE CUENTA */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gunmetal-800 pb-6">
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3 shrink-0">
                                        <span className="w-2 h-8 bg-target rounded-full"></span>
                                        Bitácora de Cuenta
                                    </h2>
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {isAddingAccount ? (
                                            <form onSubmit={handleAddAccount} className="flex gap-2 w-full">
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Topstep Intento 2"
                                                    value={newAccountName}
                                                    onChange={(e) => setNewAccountName(e.target.value)}
                                                    className="bg-gunmetal-800 border border-gunmetal-700 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-48"
                                                    autoFocus
                                                />
                                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-3 rounded-lg text-white font-bold text-sm">
                                                    Crear
                                                </button>
                                                <button type="button" onClick={() => setIsAddingAccount(false)} className="bg-gunmetal-800 hover:bg-gunmetal-700 px-3 rounded-lg text-gray-400 font-bold text-sm border border-gunmetal-700">
                                                    Cancelar
                                                </button>
                                            </form>
                                        ) : (
                                            <>
                                                {accounts.length > 0 && (
                                                    <select
                                                        value={activeAccountId || ''}
                                                        onChange={(e) => setActiveAccount(e.target.value)}
                                                        className="appearance-none bg-gunmetal-950 border border-gunmetal-700 text-white font-bold text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-blue-500 flex-1 md:flex-none cursor-pointer"
                                                    >
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>
                                                                {acc.status === 'passed' ? '🏆 ' : acc.status === 'failed' ? '💀 ' : '🟢 '}{acc.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                <button 
                                                    onClick={() => setIsAddingAccount(true)}
                                                    className="bg-gunmetal-800 hover:bg-gunmetal-700 text-white border border-gunmetal-600 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors shrink-0"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    NUEVA CUENTA
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {!activeAccount ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                                        <ShieldAlert className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                                        <p className="text-lg font-bold text-gray-400 mb-2">Ninguna cuenta seleccionada</p>
                                        <p className="text-sm text-gray-500 max-w-md">Crea una nueva cuenta de fondeo para empezar el tracking de tus tiros y monitorear tu progreso hacia la meta.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* STATUS BANNER */}
                                        {isReadOnly && (
                                            <div className={`mb-6 p-4 rounded-xl border flex items-center justify-center gap-3 ${activeAccount.status === 'passed' ? 'bg-target/20 border-target/50 text-target' : 'bg-stop/20 border-stop/50 text-stop'}`}>
                                                {activeAccount.status === 'passed' ? <Trophy className="w-6 h-6" /> : <Skull className="w-6 h-6" />}
                                                <span className="font-black tracking-wider uppercase">
                                                    {activeAccount.status === 'passed' ? '¡CUENTA APROBADA!' : 'CUENTA QUEMADA'}
                                                </span>
                                                <span className="text-xs font-bold opacity-70 ml-2 block sm:inline">(Modo de solo lectura)</span>
                                            </div>
                                        )}

                                        {/* DASHBOARD DE CUENTA APROBADA/REPROBADA */}
                                        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 ${isReadOnly ? 'opacity-70' : ''}`}>
                                            <div className="bg-gunmetal-950/50 border border-gunmetal-800 p-4 rounded-2xl flex flex-col relative overflow-hidden">
                                                {activeAccount.status === 'passed' && <div className="absolute inset-0 bg-target/5" />}
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 relative z-10">Balance Actual</p>
                                                <p className="text-xl md:text-2xl font-black text-white font-mono relative z-10">
                                                    ${displayBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="bg-gunmetal-950/50 border border-gunmetal-800 p-4 rounded-2xl flex flex-col relative overflow-hidden">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 relative z-10">Win Rate</p>
                                                <p className="text-xl md:text-2xl font-black text-white font-mono relative z-10">
                                                    {winRate.toFixed(1)}%
                                                </p>
                                            </div>
                                            <div className="bg-gunmetal-950/50 border border-gunmetal-800 p-4 rounded-2xl flex flex-col relative overflow-hidden">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 relative z-10">Racha Actual</p>
                                                <p className={`text-xl md:text-2xl font-black font-mono relative z-10 ${currentStreak > 0 ? (isWinStreak ? 'text-target' : 'text-stop') : 'text-gray-500'}`}>
                                                    {currentStreak > 0 ? `${currentStreak} ${isWinStreak ? 'W' : 'L'}` : '-'}
                                                </p>
                                            </div>
                                            <div className="bg-gunmetal-950/50 border border-gunmetal-800 p-4 rounded-2xl flex flex-col relative overflow-hidden">
                                                {activeAccount.status === 'failed' && <div className="absolute inset-0 bg-stop/5" />}
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 relative z-10">Max Loss Lim</p>
                                                <p className="text-xl md:text-2xl font-black text-red-500/80 font-mono relative z-10">
                                                    ${displayMll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* GRAFICO EQUITY CURVE */}
                                        <div className={`h-40 w-full mb-6 ${isReadOnly ? 'opacity-70' : ''}`}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorBalanceRules" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={displayBal >= initialBal ? "#00FF00" : "#FF0000"} stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor={displayBal >= initialBal ? "#00FF00" : "#FF0000"} stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="shot" hide />
                                                    <YAxis domain={['dataMin - 100', 'dataMax + 100']} hide />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#1A1D24', border: '1px solid #2D313A', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                                                        labelFormatter={(label) => `Tiro #${label}`}
                                                    />
                                                    <ReferenceLine y={initialBal} stroke="#4B5563" strokeDasharray="3 3" />
                                                    <Area 
                                                        type="stepAfter" 
                                                        dataKey="balance" 
                                                        stroke={displayBal >= initialBal ? "#00FF00" : "#FF0000"} 
                                                        strokeWidth={2}
                                                        fillOpacity={1} 
                                                        fill="url(#colorBalanceRules)" 
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* BARRAS DE PROGRESO */}
                                        <div className={`mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 ${isReadOnly ? 'opacity-70' : ''}`}>
                                            {/* BARRA DE SALUD (DRAWDOWN) */}
                                            <div>
                                                <div className="flex justify-between text-xs font-bold mb-2">
                                                    <span className="text-gray-400 uppercase tracking-widest">Colchón Disponible</span>
                                                    <span className={currentDrawdownRoom > 500 ? 'text-target' : 'text-red-500'}>
                                                        ${currentDrawdownRoom.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $2,000
                                                    </span>
                                                </div>
                                                <div className="h-4 w-full bg-gunmetal-950 rounded-full overflow-hidden border border-gunmetal-700/50 p-0.5 relative">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${activeAccount.status === 'passed' ? 'bg-target' : activeAccount.status === 'failed' ? 'bg-stop' : healthPercent > 50 ? 'bg-blue-500' : healthPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${healthPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {/* BARRA DE PROGRESO (TARGET) */}
                                            <div>
                                                <div className="flex justify-between text-xs font-bold mb-2">
                                                    <span className="text-gray-400 uppercase tracking-widest">Progreso de Pase</span>
                                                    <span className="text-target">
                                                        {progressPercent.toFixed(1)}% (${currentProfit > 0 ? currentProfit.toLocaleString('en-US') : '0'})
                                                    </span>
                                                </div>
                                                <div className="h-4 w-full bg-gunmetal-950 rounded-full overflow-hidden border border-gunmetal-700/50 p-0.5 relative">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ease-out bg-target`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ACCIONES DE CUENTA ACTIVA */}
                                        {!isReadOnly && (
                                            <div className="flex flex-wrap gap-2 mb-6 border-b border-gunmetal-800/50 pb-6">
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('¿Estás seguro de marcar esta cuenta como Aprobada? Se bloqueará en modo de solo lectura.')) {
                                                            updateAccountStatus(activeAccount.id, 'passed');
                                                        }
                                                    }}
                                                    className="bg-target/10 hover:bg-target/20 border border-target/50 text-target px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors flex items-center gap-2"
                                                >
                                                    <Trophy className="w-4 h-4" /> MARCAR COMO PASADA
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('¿Estás seguro de marcar esta cuenta como Quemada? Se bloqueará en modo de solo lectura.')) {
                                                            updateAccountStatus(activeAccount.id, 'failed');
                                                        }
                                                    }}
                                                    className="bg-stop/10 hover:bg-stop/20 border border-stop/50 text-stop px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors flex items-center gap-2"
                                                >
                                                    <Skull className="w-4 h-4" /> MARCAR COMO PERDIDA
                                                </button>
                                                <div className="flex-1" />
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('¿Eliminar permanentemente esta cuenta?')) {
                                                            deleteAccount(activeAccount.id);
                                                        }
                                                    }}
                                                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg transition-colors border border-transparent hover:border-red-400/30"
                                                    title="Eliminar Cuenta Permanente"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* LISTA DE TIROS (CHECKLIST) */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                    <ListChecks className="w-4 h-4" />
                                                    Registro de Tiros
                                                </h3>
                                                {!isReadOnly && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={resetShotsInActive}
                                                            className="text-gray-500 hover:text-gray-300 text-xs font-bold px-2 py-1"
                                                            title="Limpiar tiros"
                                                        >
                                                            Limpiar
                                                        </button>
                                                        <button
                                                            onClick={() => addShotToActive(null)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors shadow-lg shadow-blue-500/20"
                                                        >
                                                            + NUEVO TIRO
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2 pb-4">
                                                {shots.length === 0 ? (
                                                    <div className="text-center py-10 border border-dashed border-gunmetal-700 rounded-2xl opacity-60">
                                                        <Target className="w-10 h-10 text-gray-500 mx-auto mb-3 opacity-50" />
                                                        <p className="text-sm text-gray-400 font-medium">No hay tiros registrados en esta cuenta.</p>
                                                        {!isReadOnly && (
                                                            <p className="text-xs text-gray-500">Haz clic en &apos;+ NUEVO TIRO&apos; para empezar la bitácora.</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    shots.map((shot, index) => (
                                                        <div key={shot.id} className={`flex items-center justify-between bg-gunmetal-950/40 p-3 rounded-xl border border-gunmetal-800/80 group ${isReadOnly ? 'opacity-80' : ''}`}>
                                                            <div className="flex items-center gap-4">
                                                                <span className="font-mono text-gray-600 font-black text-sm w-6">
                                                                    #{index + 1}
                                                                </span>
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        disabled={isReadOnly}
                                                                        onClick={() => updateShotInActive(shot.id, 'target')}
                                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                                            shot.outcome === 'target' 
                                                                            ? 'bg-target/20 text-target border-target/50 shadow-[0_0_10px_rgba(var(--color-target-rgb),0.2)]'
                                                                            : 'bg-gunmetal-800/50 text-gray-500 border-transparent hover:bg-target/10 hover:text-target/70'
                                                                        } ${isReadOnly && shot.outcome !== 'target' ? 'opacity-30 cursor-not-allowed hidden sm:flex' : ''}`}
                                                                    >
                                                                        <ArrowUpCircle className="w-4 h-4" />
                                                                        TARGET
                                                                    </button>
                                                                    <button 
                                                                        disabled={isReadOnly}
                                                                        onClick={() => updateShotInActive(shot.id, 'stop')}
                                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                                            shot.outcome === 'stop' 
                                                                            ? 'bg-stop/20 text-stop border-stop/50 shadow-[0_0_10px_rgba(var(--color-stop-rgb),0.2)]'
                                                                            : 'bg-gunmetal-800/50 text-gray-500 border-transparent hover:bg-stop/10 hover:text-stop/70'
                                                                        } ${isReadOnly && shot.outcome !== 'stop' ? 'opacity-30 cursor-not-allowed hidden sm:flex' : ''}`}
                                                                    >
                                                                        <ArrowDownCircle className="w-4 h-4" />
                                                                        STOP
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            {!isReadOnly && (
                                                                <button 
                                                                    onClick={() => deleteShotFromActive(shot.id)}
                                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                                    title="Eliminar tiro"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
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
