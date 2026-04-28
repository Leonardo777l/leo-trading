import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

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
    user_id?: string;
    strategy?: string; // e.g. 'Order Flow'
}

interface TradeState {
    trades: Trade[];
    selectedStrategy: string;
    user: User | null;
    isLoading: boolean;
    fetchTrades: () => Promise<void>;
    addTrade: (trade: Omit<Trade, 'id' | 'netProfit'>) => Promise<void>;
    bulkAddTrades: (trades: Omit<Trade, 'id' | 'netProfit'>[]) => Promise<void>;
    removeTrade: (id: string) => Promise<void>;
    clearTrades: () => Promise<void>;
    deleteTradesByStrategy: (strategy: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: User | null) => void;
    setSelectedStrategy: (strategy: string) => void;
}

const calculateNetProfit = (outcome: Outcome, ticks: number, stop: number, contracts: number, instrument?: string, strategy?: string) => {
    // ----------------------------------------------------
    // EXACT DOLLARS OVERRIDE (contracts === 0)
    // ----------------------------------------------------
    if (contracts === 0) {
        if (outcome === 'TP') return ticks; // ticksTarget holds targetUsd
        if (outcome === 'SL') return -stop; // stopTicks holds stopUsd
        return 0; // BE
    }

    // ----------------------------------------------------
    // FIXED 1% RISK MATH ($500 base per 50k acct)
    // ----------------------------------------------------
    const s = (strategy || '').toUpperCase();
    
    if (s.includes('RR NEGATIVO')) {
        if (outcome === 'TP') return 350;
        if (outcome === 'SL') return -500;
        return 0;
    }
    
    if (s.includes('FIBONACCI FRACTAL')) {
        if (outcome === 'TP') return 750;
        if (outcome === 'SL') return -500;
        return 0;
    }
    
    if (s.includes('ORDER FLOW')) { // Default 1:3 Order Flow
        if (outcome === 'TP') return 1500;
        if (outcome === 'SL') return -500;
        return 0;
    }

    // ----------------------------------------------------
    // FALLBACK MATH (for instruments lacking strict fixed logic)
    // ----------------------------------------------------
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

    let gross = 0;
    
    if (outcome === 'TP') {
        gross = ticks * tickValue * contracts;
    } else if (outcome === 'SL') {
        gross = -(stop * tickValue * contracts);
    } else {
        gross = 0; // BE
    }

    const totalCommissions = contracts * commissionPerContract;
    return gross - totalCommissions;
};

export const useTradeStore = create<TradeState>((set, get) => ({
    trades: [],
    selectedStrategy: 'ORDER FLOW 1:3', // Default Database
    user: null,
    isLoading: false,
    fetchTrades: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true });
            
        if (!error && data) {
            const normalizedTrades = (data as Trade[]).map(t => ({
                ...t,
                netProfit: calculateNetProfit(t.outcome, t.ticksTarget, t.stopTicks, t.contracts, t.instrument, t.strategy)
            }));
            set({ trades: normalizedTrades });
        } else if (error) {
            console.error('Failed to fetch trades:', error);
        }
        set({ isLoading: false });
    },

    addTrade: async (tradeInput) => {
        const { user } = get();
        if (!user) return;

        const resolvedStrategy = tradeInput.strategy ? tradeInput.strategy.trim() : get().selectedStrategy;
        const netProfit = calculateNetProfit(tradeInput.outcome, tradeInput.ticksTarget, tradeInput.stopTicks, tradeInput.contracts, tradeInput.instrument, resolvedStrategy);
            
        const newTrade = {
            ...tradeInput,
            account: tradeInput.account?.trim().toUpperCase() || 'PERSONAL',
            netProfit,
            strategy: resolvedStrategy,
            user_id: user.id
        };

        const { data, error } = await supabase.from('trades').insert([newTrade]).select().single();
        if (!error && data) {
            set((state) => ({ trades: [...state.trades, data as Trade] }));
        } else {
            console.error('Failed to add trade:', error);
            throw error;
        }
    },
    bulkAddTrades: async (tradesInput) => {
        const { user } = get();
        if (!user) return;

        const newTrades = tradesInput.map(t => ({
            ...t,
            account: t.account?.trim().toUpperCase() || 'PERSONAL',
            strategy: t.strategy ? t.strategy.trim() : get().selectedStrategy,
            netProfit: calculateNetProfit(t.outcome, t.ticksTarget, t.stopTicks, t.contracts, t.instrument, t.strategy ? t.strategy.trim() : get().selectedStrategy),
            user_id: user.id
        }));

        const { data, error } = await supabase.from('trades').insert(newTrades).select();
        if (!error && data) {
            set((state) => ({ trades: [...state.trades, ...(data as Trade[])] }));
        } else {
            console.error('Failed to bulk add trades:', error);
        }
    },
    removeTrade: async (id) => {
        const { user } = get();
        if (!user) return;

        const { error } = await supabase.from('trades').delete().eq('id', id).eq('user_id', user.id);
        if (!error) {
            set((state) => ({ trades: state.trades.filter(t => t.id !== id) }));
        }
    },
    clearTrades: async () => {
        const { user } = get();
        if (!user) return;

        const { error } = await supabase.from('trades').delete().eq('user_id', user.id);
        if (!error) {
            set({ trades: [] });
        }
    },
    deleteTradesByStrategy: async (strategyToDelete) => {
        const { user } = get();
        if (!user) return;

        // Using LIKE to catch any possible variations like ORDER FLOW 1.5, ORDER FLOW 1:1.5
        const { error } = await supabase.from('trades').delete().eq('user_id', user.id).or(`strategy.ilike.%${strategyToDelete}%,strategy.eq.ORDER FLOW 1:1.5`);
        if (!error) {
            set((state) => ({ trades: state.trades.filter(t => !(t.strategy||'').toUpperCase().includes(strategyToDelete.toUpperCase()) && t.strategy !== 'ORDER FLOW 1:1.5') }));
        } else {
            console.error('Failed to delete trades by strategy:', error);
        }
    },
    signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: typeof window !== 'undefined' ? window.location.origin : '',
            }
        });
        if (error) console.error('Error signing in:', error.message);
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, trades: [] });
    },
    setUser: (user) => set({ user }),
    setSelectedStrategy: (strategy) => set({ selectedStrategy: strategy }),
}));

import { useMemo } from 'react';
export const useActiveTrades = () => {
    const trades = useTradeStore(state => state.trades);
    const selectedStrategy = useTradeStore(state => state.selectedStrategy);
    
    return useMemo(() => {
        // If 'ALL' is chosen, show everything, otherwise isolate strictly
        if (selectedStrategy === 'ALL') return trades;
        return trades.filter(t => (t.strategy || 'Order Flow') === selectedStrategy);
    }, [trades, selectedStrategy]);
};

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
