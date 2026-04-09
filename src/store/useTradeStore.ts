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
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: User | null) => void;
    setSelectedStrategy: (strategy: string) => void;
    migrateOrderFlowTrades: (candidates: Trade[]) => Promise<void>;
    cleanupDuplicates: (trades: Trade[]) => Promise<void>;
    heavyReseed: (trades: Omit<Trade, 'id'>[]) => Promise<void>;
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
    selectedStrategy: 'ALL',
    user: null,
    isLoading: false,
    fetchTrades: async () => {
        const { user, migrateOrderFlowTrades, cleanupDuplicates } = get();
        if (!user) return;

        set({ isLoading: true });
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true });
            
        if (!error && data) {
            const currentTrades = data as Trade[];
            set({ trades: currentTrades });
            
            // Check for unmigrated trades
            const unmigrated = currentTrades.filter(t => 
                !t.strategy || 
                t.strategy.trim().toLowerCase() === 'order flow' || 
                t.strategy.trim() === 'Order Flow'
            );

            // Check for duplicates (common after the bug)
            const hasPossibleDuplicates = currentTrades.length > 300; // Heuristic: user said 190 was normal, 1000 is bad.

            if (unmigrated.length > 0) {
                console.log('Old Order Flow trades detected, triggering migration once...');
                await migrateOrderFlowTrades(unmigrated);
                await get().fetchTrades(); // Refresh once after migration
                return;
            }

            if (hasPossibleDuplicates) {
                console.log('Checking for duplicates...');
                await cleanupDuplicates(currentTrades);
                // fetchTrades will be called inside cleanup if deletions happen
                return;
            }

            // Cleanup specific unwanted legacy strategies as requested
            const badTrades = currentTrades.filter(t => {
                const s = t.strategy?.toLowerCase() || '';
                return s.includes('liquidez') || s.includes('scalp');
            });
            if (badTrades.length > 0) {
                console.log('Deleting legacy strategies (liquidez, hard scalping)...');
                await Promise.all(badTrades.map(bt => supabase.from('trades').delete().eq('id', bt.id)));
                await get().fetchTrades();
                return;
            }

        } else if (error) {
            console.error('Failed to fetch trades:', error);
        }
        set({ isLoading: false });
    },
    migrateOrderFlowTrades: async (candidates: Trade[]) => {
        const { user } = get();
        if (!user || candidates.length === 0) return;

        console.log(`Migrating ${candidates.length} trades...`);
        for (const trade of candidates) {
            // Update original to 1:3
            await supabase.from('trades').update({ strategy: 'ORDER FLOW 1:3' }).eq('id', trade.id);

            // Clone to 1:1.5
            let newOutcome = trade.outcome;
            if (trade.outcome === 'BE' || trade.outcome === 'TP') {
                newOutcome = 'TP';
            }
            
            const newTicksTarget = trade.ticksTarget > 0 ? trade.ticksTarget / 2 : 0;
            const newNetProfit = calculateNetProfit(newOutcome, newTicksTarget, trade.stopTicks, trade.contracts, trade.instrument);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _, ...tradeWithoutId } = trade;
            await supabase.from('trades').insert([{
                ...tradeWithoutId,
                strategy: 'ORDER FLOW 1:1.5',
                outcome: newOutcome,
                ticksTarget: newTicksTarget,
                netProfit: newNetProfit,
                user_id: user.id
            }]);
        }
    },
    cleanupDuplicates: async (trades: Trade[]) => {
        const { user } = get();
        if (!user || trades.length === 0) return;

        const groups = new Map<string, Trade[]>();
        trades.forEach(t => {
            // Uniqueness key: normalized date + instrument + contracts + notes
            const d = new Date(t.date).getTime();
            const key = `${d}_${t.instrument}_${t.contracts}_${(t.notes || '').trim()}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(t);
        });

        const idsToDelete: string[] = [];
        let duplicateCount = 0;

        groups.forEach((groupTrades) => {
            const variant1p5 = groupTrades.filter(t => t.strategy === 'ORDER FLOW 1:1.5');
            const variant1p3 = groupTrades.filter(t => t.strategy === 'ORDER FLOW 1:3');

            // We only care about groups that have more than 1 clone of the same variant
            if (variant1p5.length > 1) {
                // Keep the first one, delete the rest
                variant1p5.slice(1).forEach(t => idsToDelete.push(t.id));
                duplicateCount += (variant1p5.length - 1);
            }
            if (variant1p3.length > 1) {
                variant1p3.slice(1).forEach(t => idsToDelete.push(t.id));
                duplicateCount += (variant1p3.length - 1);
            }
        });

        if (idsToDelete.length > 0) {
            console.log(`Cleanup: Found ${duplicateCount} duplicate variants. Deleting...`);
            // Batch delete
            for (let i = 0; i < idsToDelete.length; i += 50) {
                const batch = idsToDelete.slice(i, i + 50);
                await supabase.from('trades').delete().in('id', batch);
            }
            console.log('Cleanup complete.');
            await get().fetchTrades();
        }
    },
    heavyReseed: async (tradesInput) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        console.log('STARTING HEAVY RESEED: Deleting ALL trades...');
        
        // 1. Delete all
        const { error: delError } = await supabase.from('trades').delete().eq('user_id', user.id);
        if (delError) {
            console.error('Failed to clear trades:', delError);
            set({ isLoading: false });
            return;
        }

        console.log(`Inserting ${tradesInput.length} new trades...`);
        // 2. Batch Insert
        for (let i = 0; i < tradesInput.length; i += 50) {
            const batch = tradesInput.slice(i, i + 50).map(t => ({ ...t, user_id: user.id }));
            const { error: insError } = await supabase.from('trades').insert(batch);
            if (insError) console.error(`Failed to insert batch ${i}:`, insError);
        }

        console.log('Reseed complete.');
        await get().fetchTrades();
        set({ isLoading: false });
    },
    addTrade: async (tradeInput) => {
        const { user } = get();
        if (!user) return;

        const netProfit = calculateNetProfit(tradeInput.outcome, tradeInput.ticksTarget, tradeInput.stopTicks, tradeInput.contracts, tradeInput.instrument);
        const resolvedStrategy = tradeInput.strategy ? tradeInput.strategy.trim().toUpperCase() : 'ORDER FLOW 1:3';
            
        const newTrade = {
            ...tradeInput,
            account: tradeInput.account?.trim().toUpperCase() || 'PERSONAL',
            netProfit,
            strategy: resolvedStrategy,
            user_id: user.id
        };

        const { data, error } = await supabase.from('trades').insert([newTrade]).select().single();
        if (!error && data) {
            const tradesToAdd = [data as Trade];

            // AUTO GENERATE THE 1:1.5 VARIANT WHEN "ORDER FLOW 1:3" is executed
            if (resolvedStrategy === 'ORDER FLOW 1:3') {
                let newOutcome = tradeInput.outcome;
                if (tradeInput.outcome === 'BE' || tradeInput.outcome === 'TP') newOutcome = 'TP';
                const newTicksTarget = tradeInput.ticksTarget > 0 ? tradeInput.ticksTarget / 2 : 0;
                const clonedNetProfit = calculateNetProfit(newOutcome, newTicksTarget, tradeInput.stopTicks, tradeInput.contracts, tradeInput.instrument);

                const clonedInput = {
                    ...newTrade,
                    strategy: 'ORDER FLOW 1:1.5',
                    outcome: newOutcome,
                    ticksTarget: newTicksTarget,
                    netProfit: clonedNetProfit
                };

                const { data: clonedData, error: clonedError } = await supabase.from('trades').insert([clonedInput]).select().single();
                if (!clonedError && clonedData) {
                    tradesToAdd.push(clonedData as Trade);
                }
            }

            set((state) => ({ trades: [...state.trades, ...tradesToAdd] }));
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
            netProfit: calculateNetProfit(t.outcome, t.ticksTarget, t.stopTicks, t.contracts, t.instrument),
            strategy: t.strategy ? t.strategy.trim() : 'ORDER FLOW 1:3',
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
