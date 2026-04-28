'use client';

import { useActiveTrades, getTradeStats } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import {
    TrendingUp, TrendingDown, Target, Activity, BarChart2, Hash
} from 'lucide-react';

export const StatsOverview = () => {
    const trades = useActiveTrades();
    const stats = getTradeStats(trades);

    return (
        <div className="flex flex-col gap-4">
            {/* HERO METRICS - Top Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card glowColor={stats.totalNetProfit >= 0 ? "emerald" : "crimson"} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Net P&L</span>
                        {stats.totalNetProfit >= 0 ? <TrendingUp className="w-4 h-4 text-target" /> : <TrendingDown className="w-4 h-4 text-stop" />}
                    </div>
                    <div className={`text-4xl xl:text-5xl font-black tracking-tighter ${stats.totalNetProfit >= 0 ? 'text-target' : 'text-stop'}`}>
                        ${stats.totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </Card>

                <Card glowColor="none" className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
                        <Target className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-4xl xl:text-5xl font-black tracking-tighter text-white">
                        {stats.winRate.toFixed(2)}%
                    </div>
                </Card>

                <Card glowColor="none" className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Profit Factor</span>
                        <Activity className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-4xl xl:text-5xl font-black tracking-tighter text-white">
                        {isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
                    </div>
                </Card>

                <Card glowColor="none" className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Expectancy</span>
                        <BarChart2 className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className={`text-4xl xl:text-5xl font-black tracking-tighter ${stats.expectancy >= 0 ? 'text-target' : 'text-stop'}`}>
                        ${stats.expectancy.toFixed(2)}
                    </div>
                </Card>
            </div>

            {/* SECONDARY METRICS - Bottom Row (Smaller cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <Card glowColor="none" className="flex flex-col gap-1 py-3 px-4">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg Win</span>
                   <div className="text-lg font-black text-target">
                       ${stats.averageWin.toFixed(2)}
                   </div>
                </Card>

                <Card glowColor="none" className="flex flex-col gap-1 py-3 px-4">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg Loss</span>
                   <div className="text-lg font-black text-stop">
                       ${stats.averageLoss.toFixed(2)}
                   </div>
                </Card>

                <Card glowColor="none" className="flex flex-col gap-1 py-3 px-4">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><Hash className="w-3 h-3"/> Wins</span>
                   <div className="text-lg font-black text-white">
                       {stats.totalWins}
                   </div>
                </Card>

                <Card glowColor="none" className="flex flex-col gap-1 py-3 px-4">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><Hash className="w-3 h-3"/> Losses</span>
                   <div className="text-lg font-black text-white">
                       {stats.totalLosses}
                   </div>
                </Card>

                 <Card glowColor="none" className="flex flex-col gap-1 py-3 px-4">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Max Win Streak</span>
                   <div className="text-lg font-black text-target">
                       {stats.maxWinStreak}
                   </div>
                </Card>

                <Card glowColor="none" className="flex flex-col gap-1 py-3 px-4">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Max Loss Streak</span>
                   <div className="text-lg font-black text-stop">
                       {stats.maxLossStreak}
                   </div>
                </Card>
            </div>
        </div>
    );
};
