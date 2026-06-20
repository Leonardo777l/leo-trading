'use client';

import { useMemo } from 'react';
import { useActiveTrades, getTradeStats } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export const ZellaScoreCard = () => {
    const trades = useActiveTrades();
    const stats = useMemo(() => getTradeStats(trades), [trades]);

    // Calculate complex metrics: Drawdown, Recovery Factor, Consistency
    const computedMetrics = useMemo(() => {
        if (trades.length === 0) {
            return { zellaScore: 0, radarData: [] };
        }

        // 1. Daily Profits
        const dailyProfitMap = new Map<string, number>();
        trades.forEach(t => {
            try {
                const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
                const current = dailyProfitMap.get(dateKey) || 0;
                dailyProfitMap.set(dateKey, current + t.netProfit);
            } catch {}
        });
        const dailyProfits = Array.from(dailyProfitMap.values());

        // 2. Max Drawdown & Recovery Factor
        let maxDrawdown = 0;
        let peak = 0;
        let balance = 0;
        dailyProfits.forEach(p => {
            balance += p;
            if (balance > peak) peak = balance;
            const dd = peak - balance;
            if (dd > maxDrawdown) maxDrawdown = dd;
        });

        // Recovery Factor = Net Profit / Max Drawdown
        const netProfit = stats.totalNetProfit;
        const recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : 5;

        // 3. Consistency (Standard Deviation of Daily returns)
        const meanProfit = dailyProfits.reduce((a, b) => a + b, 0) / (dailyProfits.length || 1);
        const variance = dailyProfits.reduce((a, b) => a + Math.pow(b - meanProfit, 2), 0) / (dailyProfits.length || 1);
        const stdDev = Math.sqrt(variance);
        const cv = meanProfit !== 0 ? stdDev / Math.abs(meanProfit) : 3; // Coefficient of variation
        // Scaled consistency: CV close to 1 means highly consistent. CV > 3 means highly inconsistent.
        const consistencyScore = Math.max(10, Math.min(100, 100 - Math.min(90, cv * 25)));

        // Scale individual scores out of 100
        const winRateScore = stats.winRate; // e.g. 55% -> 55
        const pfScore = Math.min(100, Math.max(10, (stats.profitFactor / 2.5) * 100)); // 2.5 PF -> 100
        const avgWinLossRatio = stats.averageLoss !== 0 ? stats.averageWin / Math.abs(stats.averageLoss) : 1;
        const ratioScore = Math.min(100, Math.max(10, (avgWinLossRatio / 3.0) * 100)); // 3.0 ratio -> 100
        const rfScore = Math.min(100, Math.max(10, (recoveryFactor / 4.0) * 100)); // 4.0 RF -> 100
        const drawdownScore = Math.max(10, Math.min(100, 100 - (maxDrawdown / 5000) * 100)); // DD > $5000 is poor

        // Weighted Zella Score
        const zellaScore = Math.round(
            (winRateScore * 0.25) +
            (pfScore * 0.20) +
            (ratioScore * 0.15) +
            (rfScore * 0.15) +
            (drawdownScore * 0.15) +
            (consistencyScore * 0.10)
        );

        // Radar chart data structure
        const radarData = [
            { subject: 'Win %', value: Math.round(winRateScore), fullMark: 100 },
            { subject: 'Profit factor', value: Math.round(pfScore), fullMark: 100 },
            { subject: 'Avg win/loss', value: Math.round(ratioScore), fullMark: 100 },
            { subject: 'Recovery factor', value: Math.round(rfScore), fullMark: 100 },
            { subject: 'Max drawdown', value: Math.round(drawdownScore), fullMark: 100 },
            { subject: 'Consistency', value: Math.round(consistencyScore), fullMark: 100 },
        ];

        return { zellaScore, radarData };
    }, [trades, stats]);

    const { zellaScore, radarData } = computedMetrics;

    return (
        <Card className="flex flex-col bg-[#131316] border-gunmetal-700 min-h-[420px] p-5 justify-between">
            {/* Title / Help Header */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Zella score</span>
                <span className="text-xs text-gray-400 cursor-help border border-gunmetal-700 w-5 h-5 flex items-center justify-center rounded-full font-bold">?</span>
            </div>

            {/* Radar Spider-web Chart */}
            <div className="w-full h-[240px] flex items-center justify-center my-2">
                {trades.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#222" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Zella score"
                                dataKey="value"
                                stroke="#7c3aed"
                                fill="#7c3aed"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <span className="text-xs font-bold text-gray-600">No trading activity</span>
                )}
            </div>

            {/* Zella Score progress bar slider */}
            <div className="flex flex-col gap-2 mt-2 w-full">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Zella Score</span>
                        <span className="text-3xl font-black text-white mt-0.5">{trades.length > 0 ? zellaScore : '--'}</span>
                    </div>
                </div>

                {/* Score bar line with custom linear gradient background */}
                <div className="relative w-full h-2.5 rounded-full bg-gunmetal-800 overflow-visible mt-1 border border-gunmetal-700/50">
                    {/* Color spectrum gradient */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-80" />
                    
                    {/* Thumb indicator representing current score */}
                    {trades.length > 0 && (
                        <div
                            className="absolute -top-1 w-4.5 h-4.5 rounded-full bg-white border-2 border-purple-600 shadow-[0_0_10px_rgba(124,58,237,0.7)] transition-all duration-1000 -ml-2"
                            style={{ left: `${zellaScore}%` }}
                        />
                    )}
                </div>

                {/* Legend markers */}
                <div className="flex justify-between text-[9px] text-gray-600 font-black tracking-widest mt-1">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                    <span>60</span>
                    <span>80</span>
                    <span>100</span>
                </div>
            </div>
        </Card>
    );
};
