'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { DatabaseBackup, Loader2, CheckCircle2 } from 'lucide-react';
import { useTradeStore, Direction, Outcome, EstadoMental, Trade } from '@/store/useTradeStore';

export const RecoveryButton = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const bulkAddTrades = useTradeStore(state => state.bulkAddTrades);

    const handleRestore = async () => {
        setStatus('loading');
        try {
            const response = await fetch('/trades_history.csv');
            if (!response.ok) throw new Error('File not found');
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                complete: async (results: any) => {
                    const mapped = autoMap(results.data);
                    await bulkAddTrades(mapped);
                    setStatus('success');
                    setTimeout(() => setStatus('idle'), 3000);
                }
            });
        } catch (error) {
            console.error('Failed to restore:', error);
            setStatus('idle');
            alert('Error al restaurar los datos.');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoMap = (data: any[]) => {
        return data.map(row => {
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
                
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    return new Date(`${s}T12:00:00`);
                }
                
                const match = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(.*)$/);
                if (match) {
                    const p1 = parseInt(match[1], 10);
                    const p2 = parseInt(match[2], 10);
                    let year = parseInt(match[3], 10);
                    if (year < 100) year += 2000;
                    
                    const day = p1 > 12 ? p1 : (p2 > 12 ? p2 : p1);
                    const month = p1 > 12 ? p2 : (p2 > 12 ? p1 : p2);
                    
                    const d = new Date(year, month - 1, day, 12, 0, 0, 0);
                    if (!isNaN(d.getTime())) return d;
                }
                
                let d = new Date(s);
                if (!isNaN(d.getTime())) {
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
            let instrument = 'NQ';
            if (rawInstrument) {
                if (rawInstrument.includes('MNQ') || rawInstrument.includes('MICRO NASDAQ')) instrument = 'MNQ';
                else if (rawInstrument.includes('NQ') || rawInstrument.includes('NASDAQ')) instrument = 'NQ';
                else if (rawInstrument.includes('MES') || rawInstrument.includes('MICRO ES')) instrument = 'MES';
                else if (rawInstrument.includes('ES') || rawInstrument.includes('S&P')) instrument = 'ES';
                else if (rawInstrument.includes('GC') || rawInstrument.includes('GOLD')) instrument = 'GC';
                else if (rawInstrument.includes('CL') || rawInstrument.includes('OIL')) instrument = 'CL';
                else instrument = rawInstrument.substring(0, 4);
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
                notes,
                strategy: 'Order Flow'
            };

            if (netProfitOverride !== undefined && !isNaN(netProfitOverride)) {
                payload.netProfitOverride = netProfitOverride;
            }

            return payload;
        }) as Omit<Trade, 'id' | 'netProfit'>[];
    };

    return (
        <button
            onClick={handleRestore}
            disabled={status !== 'idle'}
            className="flex items-center gap-2 bg-target text-black px-4 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(0,200,5,0.4)] transition-all animate-pulse shadow-[0_0_10px_rgba(0,200,5,0.2)]"
        >
            {status === 'idle' && <DatabaseBackup className="w-4 h-4" />}
            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {status === 'idle' && 'RECOVER MARCH 6 DATA'}
            {status === 'loading' && 'RECOVERING...'}
            {status === 'success' && 'SUCCESS!'}
        </button>
    );
};
