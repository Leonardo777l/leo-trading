'use client';

import { useTradeStore, getTradeStats } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import {
    TrendingUp, TrendingDown, Target, Activity, BarChart2, Hash
} from 'lucide-react';

export const StatsOverview = () => {
    const trades = useTradeStore(state => state.trades);
    const stats = getTradeStats(trades);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">

            {/* Primary Metrics */}
            <Card glowColor={stats.totalNetProfit >= 0 ? "emerald" : "crimson"} className="flex flex-col gap-2 col-span-2 sm:col-span-3 lg:col-span-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-sm font-medium uppercase tracking-wider text-white">Ganancia Neta</span>
                    {stats.totalNetProfit >= 0 ? <TrendingUp className="w-5 h-5 text-target" /> : <TrendingDown className="w-5 h-5 text-stop" />}
                </div>
                <div className={`text-4xl sm:text-5xl font-black tracking-tighter ${stats.totalNetProfit >= 0 ? 'text-target' : 'text-stop'}`}>
                    ${stats.totalNetProfit.toFixed(2)}
                </div>
            </Card>

            <Card glowColor="none" className="flex flex-col gap-2 col-span-2 sm:col-span-1 lg:col-span-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-sm font-medium uppercase tracking-wider text-white">Win Rate</span>
                    <Target className="w-5 h-5 text-target" />
                </div>
                <div className="text-4xl font-black tracking-tighter text-white">
                    {stats.winRate.toFixed(2)}%
                </div>
            </Card>

            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Porfit Factor</span>
                    <Activity className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-white">
                    {isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(3) : '∞'}
                </div>
            </Card>

            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Esperanza</span>
                    <BarChart2 className="w-4 h-4" />
                </div>
                <div className={`text-2xl font-bold ${stats.expectancy >= 0 ? 'text-target' : 'text-stop'}`}>
                    ${stats.expectancy.toFixed(2)}
                </div>
            </Card>

            {/* Averages */}
            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-semibold uppercase tracking-wider leading-tight">Promedio <br />Ganancia</span>
                    <TrendingUp className="w-4 h-4 text-target/70" />
                </div>
                <div className="text-xl font-bold text-target">
                    ${stats.averageWin.toFixed(2)}
                </div>
            </Card>

            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-semibold uppercase tracking-wider leading-tight">Promedio <br />Perdida</span>
                    <TrendingDown className="w-4 h-4 text-stop/70" />
                </div>
                <div className="text-xl font-bold text-stop">
                    ${stats.averageLoss.toFixed(2)}
                </div>
            </Card>

            {/* Counters */}
            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Target</span>
                    <Hash className="w-4 h-4 text-target/50" />
                </div>
                <div className="text-2xl font-bold text-white">
                    {stats.totalWins}
                </div>
            </Card>

            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Stops</span>
                    <Hash className="w-4 h-4 text-stop/50" />
                </div>
                <div className="text-2xl font-bold text-white">
                    {stats.totalLosses}
                </div>
            </Card>

            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total BE</span>
                    <Hash className="w-4 h-4 text-breakeven/50" />
                </div>
                <div className="text-2xl font-bold text-white">
                    {stats.totalBreakEvens}
                </div>
            </Card>

            {/* Streaks */}
            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-semibold uppercase tracking-wider leading-tight">Racha<br />Target</span>
                    <Activity className="w-4 h-4 text-target/50" />
                </div>
                <div className="text-2xl font-bold text-target">
                    {stats.maxWinStreak}
                </div>
            </Card>

            <Card glowColor="none" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-semibold uppercase tracking-wider leading-tight">Max Racha<br />Stops</span>
                    <Activity className="w-4 h-4 text-stop/50" />
                </div>
                <div className="text-2xl font-bold text-stop">
                    {stats.maxLossStreak}
                </div>
            </Card>

        </div>
    );
};
