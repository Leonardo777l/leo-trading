'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, X, Save, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTradeStore, Direction, Outcome, EstadoMental, Trade } from '@/store/useTradeStore';
import { format } from 'date-fns';

export const CsvUploader = () => {
    const [dragActive, setDragActive] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [parsedData, setParsedData] = useState<any[] | null>(null);
    const [mappedTrades, setMappedTrades] = useState<Omit<Trade, 'id' | 'netProfit'>[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const bulkAddTrades = useTradeStore(state => state.bulkAddTrades);
    const clearTrades = useTradeStore(state => state.clearTrades);
    const trades = useTradeStore(state => state.trades);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setParsedData(results.data);
                autoMap(results.data);
            }
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoMap = (data: any[]) => {
        const newMappedItems = data.map(row => {
            const getVal = (keys: string[]) => {
                const key = Object.keys(row).find(k => 
                    keys.some(search => k.trim().toLowerCase().includes(search.toLowerCase()))
                );
                return key ? row[key] : '';
            };

            const rawDate = getVal(['date', 'fecha', 'time', 'day', 'dia', 'timestamp', 'created']);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parseTradeDate = (rawStr: any): Date => {
                if (!rawStr) return new Date();
                
                const s = String(rawStr).trim();
                
                // Prevent timezone UTC rollback on exact "YYYY-MM-DD" formatted CSV strings
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    return new Date(`${s}T12:00:00`);
                }
                
                // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
                const match = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(.*)$/);
                if (match) {
                    const p1 = parseInt(match[1], 10);
                    const p2 = parseInt(match[2], 10);
                    let year = parseInt(match[3], 10);
                    if (year < 100) year += 2000;
                    
                    // Assume DD/MM/YYYY for Spanish/LatAm
                    // If p2 > 12, then p2 MUST be the day. Otherwise, assume p1 is day (DD/MM).
                    // In trades_history_corregido.csv we explicitly wrote DD/MM/YYYY.
                    const day = p1 > 12 ? p1 : (p2 > 12 ? p2 : p1);
                    const month = p1 > 12 ? p2 : (p2 > 12 ? p1 : p2);
                    
                    // Month is 0-indexed in JS Date constructor
                    const d = new Date(year, month - 1, day, 12, 0, 0, 0);
                    if (!isNaN(d.getTime())) return d;
                }
                
                // Try standard new Date as fallback for ISO or US formats
                let d = new Date(s);
                if (!isNaN(d.getTime())) {
                    // It's a valid date (like ISO string 2026-03-01T22:45:09.927Z)
                    // We must retain the day it represents in local time, but force it to midday 
                    // to prevent charting libraries from shifting it
                    d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
                    return d;
                }
                
                const fallback = new Date();
                fallback.setHours(12, 0, 0, 0);
                return fallback;
            };

            const validDate = parseTradeDate(rawDate);

            let rawDir = getVal(['direction', 'type', 'dir', 'accion', 'long', 'short', 'direcci', 'posicion', 'trade']);
            if (!rawDir) {
                const allVals = Object.values(row).join(' ').toUpperCase();
                if (allVals.includes('SHORT') || allVals.includes('SELL') || allVals.includes('VENTA') || allVals.includes('CORTO')) rawDir = 'Short';
            }
            const direction: Direction = rawDir.toLowerCase().includes('short') || rawDir.toLowerCase().includes('sell') || rawDir.toLowerCase().includes('venta') || rawDir.toLowerCase().includes('corto') ? 'Short' : 'Long';

            const rawTicks = parseFloat(getVal(['target', 'ticks', 'tp', 'ganancia']));
            const ticksTarget = isNaN(rawTicks) ? 0 : rawTicks;

            const rawStop = parseFloat(getVal(['stop', 'sl', 'perdida', 'riesgo']));
            const stopTicks = isNaN(rawStop) ? 0 : rawStop;

            const rawContracts = parseInt(getVal(['contracts', 'qty', 'size', 'contratos', 'lotes']), 10);
            const contracts = isNaN(rawContracts) ? 1 : rawContracts;

            const rawOverrideStr = getVal(['closed p&l', 'net profit', 'pnl', 'net', 'profit/loss', 'total']).toString().replace(/[^0-9.-]/g, '');
            const netProfitOverride = rawOverrideStr ? parseFloat(rawOverrideStr) : undefined;

            let rawOutcome = getVal(['outcome', 'resultado', 'win', 'rr', 'estado', 'beneficio', 'final', 'operacion', 'operación']).toUpperCase();
            if (!rawOutcome) {
                if (netProfitOverride !== undefined) {
                    if (netProfitOverride > 0) rawOutcome = 'TP';
                    else if (netProfitOverride < 0) rawOutcome = 'SL';
                    else rawOutcome = 'BE';
                } else {
                    const allVals = Object.values(row).join(' ').toUpperCase();
                    if (allVals.includes('BREAK EVEN') || allVals.match(/\bBE\b/)) rawOutcome = 'BE';
                    else if (allVals.includes('STOP') || allVals.match(/\bSL\b/)) rawOutcome = 'SL';
                    else if (allVals.includes('TARGET') || allVals.match(/\bTP\b/)) rawOutcome = 'TP';
                }
            }
            let outcome: Outcome = 'TP';
            if (rawOutcome.includes('BE') || rawOutcome.includes('EVEN') || rawOutcome === 'BE') {
                outcome = 'BE';
            } else if (rawOutcome.includes('SL') || rawOutcome.includes('LOSS') || rawOutcome.includes('STOP') || rawOutcome === 'SL') {
                outcome = 'SL';
            }

            let rawMood = getVal(['mood', 'mental', 'estado', 'psico', 'emocion']).toUpperCase();
            if (!rawMood) {
                const allVals = Object.values(row).join(' ').toUpperCase();
                if (allVals.includes('ANX') || allVals.includes('ANSIEDAD')) rawMood = 'ANXIETY';
                else if (allVals.includes('FOMO')) rawMood = 'FOMO';
            }
            let estadoMental: EstadoMental = 'Calm';
            if (rawMood.includes('ANX') || rawMood.includes('ANSIEDAD')) estadoMental = 'Anxiety';
            if (rawMood.includes('FOMO')) estadoMental = 'FOMO';

            const account = getVal(['account', 'cuenta', 'portfolio', 'back testing', 'backtest']) || 'Personal';

            const rawInstrument = getVal(['instrument', 'symbol', 'ticker', 'asset', 'simbolo', 'activo']).toUpperCase();
            let instrument = 'NQ'; // Default
            if (rawInstrument) {
                if (rawInstrument.includes('MNQ') || rawInstrument.includes('MICRO NASDAQ')) instrument = 'MNQ';
                else if (rawInstrument.includes('NQ') || rawInstrument.includes('NASDAQ')) instrument = 'NQ';
                else if (rawInstrument.includes('MES') || rawInstrument.includes('MICRO ES')) instrument = 'MES';
                else if (rawInstrument.includes('ES') || rawInstrument.includes('S&P')) instrument = 'ES';
                else if (rawInstrument.includes('GC') || rawInstrument.includes('GOLD')) instrument = 'GC';
                else if (rawInstrument.includes('CL') || rawInstrument.includes('OIL')) instrument = 'CL';
                else instrument = rawInstrument.substring(0, 4); // generic fallback taking first 4 chars e.g., NQZ3
            }

            const notes = getVal(['notes', 'notas', 'comentarios', 'comments', 'desc', 'descripcion']);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
                date: validDate.toISOString(),
                direction,
                outcome,
                ticksTarget,
                stopTicks,
                contracts,
                estadoMental,
                imageLink: getVal(['link', 'image', 'url', 'liga', 'tv']),
                account,
                instrument,
                notes
            };

            if (netProfitOverride !== undefined && !isNaN(netProfitOverride)) {
                payload.netProfitOverride = netProfitOverride;
            }

            return payload;
        });

        setMappedTrades(newMappedItems);
    };

    const handleConfirm = () => {
        if (mappedTrades.length > 0) {
            bulkAddTrades(mappedTrades);
            setParsedData(null);
            setMappedTrades([]);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <Card className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight">Import Data</h3>
                <div className="flex items-center gap-2">
                    {trades.length > 0 && !parsedData && (
                        <button
                            onClick={() => {
                                if (window.confirm('¿Seguro que quieres borrar TODOS los trades importados? Esta acción no se puede deshacer.')) {
                                    clearTrades();
                                    // Hard fallback just in case Zustand persist fights the clear
                                    if (typeof window !== 'undefined') {
                                        window.localStorage.removeItem('leo-trading-storage');
                                        window.location.reload();
                                    }
                                }
                            }}
                            className="text-stop bg-stop/10 hover:bg-stop/20 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            RESET DB
                        </button>
                    )}
                    {parsedData && (
                        <button
                            onClick={() => { setParsedData(null); setMappedTrades([]); if (inputRef.current) inputRef.current.value = ''; }}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {!parsedData ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${dragActive ? 'border-target bg-target/5' : 'border-gunmetal-700 hover:border-gunmetal-600 hover:bg-gunmetal-800'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleChange}
                        className="hidden"
                    />
                    <Upload className={`w-10 h-10 mb-4 ${dragActive ? 'text-target' : 'text-gray-500'}`} />
                    <p className="text-white font-medium">Drag & Drop your CSV file here</p>
                    <p className="text-sm text-gray-500 mt-2">or click to browse from your computer</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="bg-gunmetal-900 rounded-lg border border-gunmetal-700 overflow-hidden">
                        <div className="p-4 border-b border-gunmetal-700 bg-gunmetal-800/50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-white">Data Preview</h4>
                                <p className="text-xs text-gray-400">Found {mappedTrades.length} trades. Math calculations will run automatically on import.</p>
                            </div>
                            <button
                                onClick={handleConfirm}
                                className="flex items-center justify-center gap-2 bg-target text-black px-4 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(0,200,5,0.3)] hover:scale-105 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                Import All
                            </button>
                        </div>
                        <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-[10px] text-gray-400 uppercase bg-gunmetal-900 sticky top-0 z-10 shadow-sm border-b border-gunmetal-700">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Dir</th>
                                        <th className="px-4 py-3">Outcome</th>
                                        <th className="px-4 py-3">TP</th>
                                        <th className="px-4 py-3">SL</th>
                                        <th className="px-4 py-3">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mappedTrades.map((trade, i) => (
                                        <tr key={i} className="border-b border-gunmetal-800/50 hover:bg-gunmetal-800/50">
                                            <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{format(new Date(trade.date), 'MM/dd')}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`text-xs font-bold ${trade.direction === 'Long' ? 'text-target' : 'text-stop'}`}>
                                                    {trade.direction}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 font-medium">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trade.outcome === 'TP' ? 'bg-target/20 text-target' : trade.outcome === 'SL' ? 'bg-stop/20 text-stop' : 'bg-breakeven/20 text-breakeven'}`}>
                                                    {trade.outcome}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{trade.ticksTarget}</td>
                                            <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{trade.stopTicks}</td>
                                            <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{trade.contracts}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
