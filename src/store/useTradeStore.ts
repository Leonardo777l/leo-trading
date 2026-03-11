import { create } from 'zustand';

export type Direction = 'Long' | 'Short';
export type Outcome = 'TP' | 'SL' | 'BE';
export type EstadoMental = 'Calm' | 'Anxiety' | 'FOMO';

export interface Trade {
    id: string;
    date: string; // ISO date string
    direction: Direction;
    outcome: Outcome;
    ticksTarget: number; // Target in ticks
    stopTicks: number; // Stop in ticks
    contracts: number;
    netProfit: number; // Calculated
    estadoMental: EstadoMental;
    imageLink?: string; // TradingView link or similar
    account?: string; // e.g. 'Fondeo', 'Personal'
    instrument?: string; // e.g. 'NQ', 'MNQ', 'ES'
    notes?: string; // Custom trade notes/context
    netProfitOverride?: number; // Raw PnL fallback for prop firm statements
}

import { supabase } from '@/lib/supabase';

interface TradeState {
    trades: Trade[];
    isLoading: boolean;
    fetchTrades: () => Promise<void>;
    addTrade: (trade: Omit<Trade, 'id' | 'netProfit'>) => Promise<void>;
    bulkAddTrades: (trades: Omit<Trade, 'id' | 'netProfit'>[]) => Promise<void>;
    removeTrade: (id: string) => Promise<void>;
    clearTrades: () => Promise<void>;
}

const calculateNetProfit = (outcome: Outcome, ticks: number, stop: number, contracts: number, instrument?: string) => {
    let tickValue = 0.50; // Default MNQ
    let commissionPerContract = 1.20; // Default MNQ

    switch (instrument?.toUpperCase()) {
        case 'NQ':
            tickValue = 5.00;
            commissionPerContract = 4.10;
            break;
        case 'ES':
            tickValue = 12.50;
            commissionPerContract = 4.10;
            break;
        case 'MES':
            tickValue = 1.25;
            commissionPerContract = 1.20;
            break;
        case 'CL':
        case 'GC':
            tickValue = 10.00;
            commissionPerContract = 4.50;
            break;
        case 'MNQ':
        default:
            tickValue = 0.50;
            commissionPerContract = 1.20;
            break;
    }

    const isDollarInput = (ticks > 150 || stop > 150);
    const effectiveTickValue = isDollarInput ? 1 : tickValue;
    const effectiveContracts = isDollarInput ? 1 : contracts; 

    let gross = 0;
    
    if (outcome === 'TP') {
        gross = ticks * effectiveTickValue * effectiveContracts;
    } else if (outcome === 'SL') {
        gross = -(stop * effectiveTickValue * effectiveContracts);
    } else {
        gross = 0; // BE
    }

    const totalCommissions = contracts * commissionPerContract;
    return gross - totalCommissions;
};

export const useTradeStore = create<TradeState>((set) => ({
    trades: [],
    isLoading: false,
    fetchTrades: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase.from('trades').select('*').order('date', { ascending: true });
        if (!error && data) {
            set({ trades: data as Trade[] });
        } else {
            console.error('Failed to fetch trades:', error);
        }
        set({ isLoading: false });
    },
    addTrade: async (tradeInput) => {
        const netProfit = tradeInput.netProfitOverride !== undefined 
            ? Number(tradeInput.netProfitOverride) 
            : calculateNetProfit(tradeInput.outcome, tradeInput.ticksTarget, tradeInput.stopTicks, tradeInput.contracts, tradeInput.instrument);
            
        const newTrade = {
            ...tradeInput,
            account: tradeInput.account?.trim().toUpperCase() || 'PERSONAL',
            netProfit
        };

        // Allow UI to update optimistically or wait for DB. Waiting guarantees sync.
        const { data, error } = await supabase.from('trades').insert([newTrade]).select().single();
        if (!error && data) {
            set((state) => ({ trades: [...state.trades, data as Trade] }));
        } else {
            console.error('Failed to add trade:', error);
        }
    },
    bulkAddTrades: async (tradesInput) => {
        const newTrades = tradesInput.map(t => ({
            ...t,
            account: t.account?.trim().toUpperCase() || 'PERSONAL',
            netProfit: t.netProfitOverride !== undefined 
                ? Number(t.netProfitOverride) 
                : calculateNetProfit(t.outcome, t.ticksTarget, t.stopTicks, t.contracts, t.instrument)
        }));

        const { data, error } = await supabase.from('trades').insert(newTrades).select();
        if (!error && data) {
            set((state) => ({ trades: [...state.trades, ...(data as Trade[])] }));
        } else {
            console.error('Failed to bulk add trades:', error);
        }
    },
    removeTrade: async (id) => {
        const { error } = await supabase.from('trades').delete().eq('id', id);
        if (!error) {
            set((state) => ({ trades: state.trades.filter(t => t.id !== id) }));
        }
    },
    clearTrades: async () => {
        // Technically this might fail if we don't have permission to delete all, but the RLS allows true for deletes
        const { error } = await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (!error) {
            set({ trades: [] });
        }
    },
}));

export const getTradeStats = (trades: Trade[]) => {
    if (trades.length === 0) return {
        winRate: 0, profitFactor: 0, expectancy: 0,
        maxWinStreak: 0, maxLossStreak: 0, totalNetProfit: 0,
        averageWin: 0, averageLoss: 0, totalWins: 0, totalLosses: 0, totalBreakEvens: 0
    };

    let wins = 0;
    let losses = 0;
    let breakEvens = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let totalNetProfit = 0;

    trades.forEach(t => {
        totalNetProfit += t.netProfit;

        // An outcome is exactly what is stored. No "netProfit > 0" override to prevent BEs slipping.
        if (t.outcome === 'TP') {
            wins++;
            grossProfit += t.netProfit;

            currentWinStreak++;
            if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
            currentLossStreak = 0;
        } else if (t.outcome === 'SL') {
            losses++;
            grossLoss += Math.abs(t.netProfit);

            currentLossStreak++;
            if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
            currentWinStreak = 0;
        } else if (t.outcome === 'BE') {
            breakEvens++;

            // BEs reset BOTH streaks per standard trading methodology
            currentWinStreak = 0;
            currentLossStreak = 0;
        }
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit;
    const expectancy = totalNetProfit / trades.length;
    const averageWin = wins > 0 ? grossProfit / wins : 0;
    const averageLoss = losses > 0 ? -(grossLoss / losses) : 0; // Note: grossLoss is positive here, so we invert it for display

    return {
        winRate,
        profitFactor,
        expectancy,
        maxWinStreak,
        maxLossStreak,
        totalNetProfit,
        averageWin,
        averageLoss,
        totalWins: wins,
        totalLosses: losses,
        totalBreakEvens: breakEvens
    };
};
