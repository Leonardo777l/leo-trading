'use client';

import { useState } from 'react';
import { useActiveTrades, useTradeStore } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { Search, Activity, ExternalLink, Filter, Download, Database } from 'lucide-react';

export const TradesTable = () => {
    const trades = useActiveTrades();
    const removeTrade = useTradeStore(state => state.removeTrade);
    const selectedStrategy = useTradeStore(state => state.selectedStrategy);
    const heavyReseed = useTradeStore(state => state.heavyReseed);
    const isLoading = useTradeStore(state => state.isLoading);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterOutcome, setFilterOutcome] = useState('All');
    const [filterDirection, setFilterDirection] = useState('All');

    // Filters
    const filteredTrades = trades.filter(trade => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = term === '' || (
            trade.instrument?.toLowerCase().includes(term) ||
            trade.notes?.toLowerCase().includes(term) ||
            trade.account?.toLowerCase().includes(term) ||
            trade.estadoMental.toLowerCase().includes(term)
        );
        const matchesOutcome = filterOutcome === 'All' || trade.outcome === filterOutcome;
        const matchesDirection = filterDirection === 'All' || trade.direction === filterDirection;

        return matchesSearch && matchesOutcome && matchesDirection;
    });

    // Sort by date descending
    const sortedTrades = [...filteredTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleExportCSV = () => {
        if (trades.length === 0) return;

        const headers = ['Date', 'Result', 'Net P&L', 'Asset', 'Account', 'Direction', 'Contracts', 'Target Ticks', 'Stop Ticks', 'Strategy', 'Mental State', 'Notes'];
        
        const rows = trades.map(t => [
            format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
            t.outcome,
            t.netProfit.toFixed(2),
            t.instrument || 'NQ',
            t.account || 'PERSONAL',
            t.direction,
            t.contracts,
            t.ticksTarget,
            t.stopTicks,
            t.strategy || 'Order Flow',
            t.estadoMental,
            `"${(t.notes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const strategyName = selectedStrategy === 'ALL' ? 'all_strategies' : selectedStrategy.toLowerCase().replace(/\s+/g, '_');
        link.setAttribute('download', `${strategyName}_trades_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (trades.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center text-gray-500 min-h-[400px]">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p>No trades logged yet.</p>
                <p className="text-sm mt-2">Use the Action Button below to add your first trade.</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-full min-h-[600px] overflow-hidden" noPadding>
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4 border-b border-glassBorder bg-gunmetal-900/50">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Trade History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Showing {filteredTrades.length} of {trades.length} executions</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={async () => {
                            if (confirm('¿ESTÁS SEGURO? Esto borrará TODA la base de datos actual y cargará los trades originales de tu archivo TRADES TOTALES.csv (con NQ convertido a MNQ).')) {
                                try {
                                    const response = await fetch('/reseedData.json');
                                    if (!response.ok) throw new Error('Could not load backup data');
                                    const data = await response.json();
                                    
                                    await heavyReseed(data);
                                    alert('Base de datos restaurada con éxito!');
                                } catch {
                                    alert('Error al restaurar. Revisa la consola.');
                                }
                            }
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        title="Restaurar desde Backup Original"
                    >
                        <Database className="w-4 h-4" />
                        <span>{isLoading ? 'Restaurando...' : 'Restaurar Backup Original'}</span>
                    </button>

                    <div className="flex items-center gap-2 bg-gunmetal-800 border border-gunmetal-700 rounded-lg p-1.5">
                        <Filter className="w-4 h-4 text-gray-400 ml-1" />
                        <select
                            value={filterOutcome}
                            onChange={(e) => { setFilterOutcome(e.target.value); }}
                            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                        >
                            <option value="All">All Results</option>
                            <option value="TP">Wins (TP)</option>
                            <option value="SL">Losses (SL)</option>
                            <option value="BE">Break Evens</option>
                        </select>
                        <div className="w-px h-4 bg-gunmetal-600 mx-1"></div>
                        <select
                            value={filterDirection}
                            onChange={(e) => { setFilterDirection(e.target.value); }}
                            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                        >
                            <option value="All">All Directions</option>
                            <option value="Long">Longs</option>
                            <option value="Short">Shorts</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search notes, tickers..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                            }}
                            className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-target/50 transition-colors w-full sm:w-48"
                        />
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 bg-target/10 hover:bg-target/20 text-target border border-target/20 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold"
                        title="Export All Trades to CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto custom-scrollbar max-h-[60vh]">
                <table className="w-full text-sm text-left relative">
                    <thead className="text-[10px] text-gray-400 uppercase bg-gunmetal-900 sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(0,0,0,0.5)] border-b border-gunmetal-700">
                        <tr>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50">Date</th>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50">Result</th>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50 text-right">Net P&L</th>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50">Asset</th>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50">Direction</th>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50">Conts</th>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50">Targets (T/S)</th>
                            <th className="px-3 py-2 font-bold tracking-wider border-r border-gunmetal-700/50">Notes / Setup</th>
                            <th className="px-3 py-2 font-bold tracking-wider text-center">Del</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                        {sortedTrades.map((trade) => {
                            const isWin = trade.netProfit > 0;
                            const isLoss = trade.netProfit < 0;

                            return (
                                <tr key={trade.id} className="border-b border-gunmetal-800/50 hover:bg-gunmetal-800 transition-colors group">
                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-300 border-r border-gunmetal-800/50">
                                        {format(new Date(trade.date), 'MM/dd/yy HH:mm')}
                                    </td>

                                    <td className="px-3 py-1.5 whitespace-nowrap border-r border-gunmetal-800/50">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.outcome === 'TP' ? 'bg-target/20 text-target' : trade.outcome === 'SL' ? 'bg-stop/20 text-stop' : 'bg-breakeven/20 text-breakeven'}`}>
                                            {trade.outcome}
                                        </span>
                                    </td>

                                    <td className={`px-3 py-1.5 whitespace-nowrap text-right border-r border-gunmetal-800/50 font-bold ${isWin ? 'text-target bg-target/5' : isLoss ? 'text-stop bg-stop/5' : 'text-breakeven'}`}>
                                        {isWin ? '+' : ''}{trade.netProfit.toFixed(2)}
                                    </td>

                                    <td className="px-3 py-1.5 whitespace-nowrap border-r border-gunmetal-800/50">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-white">{trade.instrument || 'NQ'}</span>
                                            <span className="text-[9px] text-gray-500 uppercase bg-gunmetal-900 px-1 rounded">{trade.account || 'Personal'}</span>
                                        </div>
                                    </td>

                                    <td className={`px-3 py-1.5 whitespace-nowrap font-bold border-r border-gunmetal-800/50 ${trade.direction === 'Long' ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                        {trade.direction.toUpperCase()}
                                    </td>

                                    <td className="px-3 py-1.5 whitespace-nowrap text-center text-gray-300 border-r border-gunmetal-800/50">
                                        {trade.contracts}
                                    </td>

                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-400 border-r border-gunmetal-800/50 text-[10px]">
                                        T:{trade.ticksTarget} / S:{trade.stopTicks}
                                    </td>

                                    <td className="px-3 py-1.5 max-w-[250px] border-r border-gunmetal-800/50">
                                        <div className="flex items-center gap-2 relative group/notes w-full">
                                            <span className={`flex-shrink-0 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border shadow-[0_0_10px_inset] ${trade.estadoMental === 'Calm' ? 'bg-blue-900/40 text-blue-300 border-blue-500/50 shadow-blue-500/20 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' :
                                                trade.estadoMental === 'Anxiety' ? 'bg-orange-900/40 text-orange-300 border-orange-500/50 shadow-orange-500/20 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]' :
                                                    'bg-purple-900/40 text-purple-300 border-purple-500/50 shadow-purple-500/20 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]'
                                                }`}>
                                                {trade.estadoMental}
                                            </span>
                                            {trade.notes ? (
                                                <div className="flex-1 min-w-0 flex items-center h-full">
                                                    <span className="text-[11px] text-gray-300 truncate block font-medium">
                                                        {trade.notes}
                                                    </span>
                                                    <div className="hidden group-hover/notes:block absolute left-[60px] top-full mt-2 z-50 bg-gunmetal-900/95 backdrop-blur-xl p-3 text-white rounded-lg shadow-[0_0_30px_rgba(0,200,5,0.15)] border border-target/20 w-max max-w-[300px] whitespace-normal text-xs leading-relaxed before:content-[''] before:absolute before:-top-2 before:left-4 before:border-8 before:border-transparent before:border-b-gunmetal-900">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-target/5 to-transparent rounded-lg pointer-events-none"></div>
                                                        <span className="relative z-10">{trade.notes}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-600/50 italic flex-1">...</span>
                                            )}
                                            {trade.imageLink && (
                                                <a href={trade.imageLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all flex-shrink-0 relative z-10">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-1.5 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this trade?')) {
                                                    removeTrade(trade.id);
                                                }
                                            }}
                                            className="text-gray-600 hover:text-stop transition-colors rounded hover:bg-stop/10 inline-flex items-center justify-center p-1"
                                            title="Delete Trade"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
