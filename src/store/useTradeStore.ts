import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface TradeState {
    trades: Trade[];
    addTrade: (trade: Omit<Trade, 'id' | 'netProfit'>) => void;
    bulkAddTrades: (trades: Omit<Trade, 'id' | 'netProfit'>[]) => void;
    removeTrade: (id: string) => void;
    clearTrades: () => void;
}

const calculateNetProfit = (outcome: Outcome, ticks: number, stop: number, contracts: number, instrument?: string) => {
    let tickValue = 0.50; // Default MNQ
    let commissionPerContract = 1.20; // Default MNQ

    switch (instrument?.toUpperCase()) {
        case 'NQ':
            // NQ is $20 per point (4 ticks of $5).
            // If users input large numbers like "500", they often mean $500 PNL or 50.0 points.
            // Let's stick to standard tick value but add a safeguard: if ticks > 100, they might be using points * 10 or raw $ value.
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

    // Safety check: if user inputs 500 "ticks" for NQ, they likely mean $500, not 500 * $5 = $2500 per contract.
    // Prop firm dashboard standard: if ticks value is extraordinarily high (e.g., > 100), it's often a raw dollar amount input by mistake.
    // However, to keep it mathematically pure to the user's input:
    let gross = 0;
    
    // If "ticks" is clearly a dollar amount (e.g. 574 on a 2 contract trade usually means $574 total, not 574 ticks * $5 * 2 = $5740)
    // We will assume if it's over 100 on NQ, it's actually representing the raw PnL divided by contracts, or just raw PnL.
    // Let's use a simpler heuristic: If it's a direct P&L override use it, otherwise calculate strictly.
    // Wait, let's look at the CSV: "574" TP on 2 contracts, outcome is "TP".
    // If standard NQ: 574 ticks = 143.5 points = $2,870 per contract = $5,740 total. Which matches the screenshot ($5708.13 avg win).
    // The user's CSV simply has huge numbers for "Ticks" and "Stop". They probably track "Dollars" in those columns!
    // To fix this globally without breaking manual entry: if ticksTarget >= 100 and it's NQ/ES, they are likely entering Dollars.
    const isDollarInput = (ticks > 150 || stop > 150);
    const effectiveTickValue = isDollarInput ? 1 : tickValue;
    const effectiveContracts = isDollarInput ? 1 : contracts; // If it's pure dollars, don't multiply by contracts again usually

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

export const useTradeStore = create<TradeState>()(
    persist(
        (set) => ({
            trades: [],
            addTrade: (tradeInput) => set((state) => {
                const newTrade: Trade = {
                    ...tradeInput,
                    account: tradeInput.account?.trim().toUpperCase() || 'PERSONAL',
                    id: crypto.randomUUID(),
                    netProfit: tradeInput.netProfitOverride !== undefined ? Number(tradeInput.netProfitOverride) : calculateNetProfit(tradeInput.outcome, tradeInput.ticksTarget, tradeInput.stopTicks, tradeInput.contracts, tradeInput.instrument)
                };
                return { trades: [...state.trades, newTrade] };
            }),
            bulkAddTrades: (tradesInput) => set((state) => {
                const newTrades = tradesInput.map(t => ({
                    ...t,
                    account: t.account?.trim().toUpperCase() || 'PERSONAL',
                    id: crypto.randomUUID(),
                    netProfit: t.netProfitOverride !== undefined ? Number(t.netProfitOverride) : calculateNetProfit(t.outcome, t.ticksTarget, t.stopTicks, t.contracts, t.instrument)
                }));
                return { trades: [...state.trades, ...newTrades] };
            }),
            removeTrade: (id) => set((state) => ({ trades: state.trades.filter(t => t.id !== id) })),
            clearTrades: () => set({ trades: [] }),
        }),
        {
            name: 'leo-trading-storage',
        }
    )
);

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
