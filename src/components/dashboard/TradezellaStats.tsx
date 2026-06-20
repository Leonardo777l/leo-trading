'use client';

import { useMemo } from 'react';
import { useActiveTrades, getTradeStats } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export const TradezellaStats = () => {
    const trades = useActiveTrades();
    const stats = useMemo(() => getTradeStats(trades), [trades]);

    // Calculate Day Win %
    const dayWinRate = useMemo(() => {
        if (trades.length === 0) return 0;
        const dailyProfitMap = new Map<string, number>();
        trades.forEach(t => {
            try {
                const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
                const current = dailyProfitMap.get(dateKey) || 0;
                dailyProfitMap.set(dateKey, current + t.netProfit);
            } catch {
                // Ignore parsing errors
            }
        });

        const dailyProfits = Array.from(dailyProfitMap.values());
        const totalDays = dailyProfits.length;
        if (totalDays === 0) return 0;

        const winningDays = dailyProfits.filter(p => p > 0).length;
        return (winningDays / totalDays) * 100;
    }, [trades]);

    // Calculate Avg Win / Loss Ratio
    const avgWinLossRatio = useMemo(() => {
        const avgWin = stats.averageWin;
        const avgLoss = Math.abs(stats.averageLoss);
        if (avgLoss === 0) return avgWin > 0 ? 99.9 : 0;
        return avgWin / avgLoss;
    }, [stats]);

    // Create Sparkline Data
    const sparklineData = useMemo(() => {
        let currentSum = 0;
        return trades.map((t, idx) => {
            currentSum += t.netProfit;
            return { id: idx, pnl: currentSum };
        });
    }, [trades]);

    // Color constants matching Tradezella
    const isPnlPositive = stats.totalNetProfit >= 0;
    const pnlTextColor = isPnlPositive ? 'text-[#00D632]' : 'text-[#FF334B]';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Net P&L Card */}
            <Card className="flex flex-col justify-between bg-[#131316] border-gunmetal-700 min-h-[140px] p-4 relative overflow-hidden">
                <div className="flex flex-col gap-1 z-10">
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Net P&L</span>
                    <h2 className={`text-3xl font-black tracking-tighter ${pnlTextColor} mt-1`}>
                        {isPnlPositive ? '+' : '-'}${Math.abs(stats.totalNetProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                </div>
                {/* Mini Sparkline Chart */}
                <div className="absolute right-0 bottom-0 w-[55%] h-[60%] opacity-80 pointer-events-none">
                    {sparklineData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                                <Line
                                    type="monotone"
                                    dataKey="pnl"
                                    stroke={isPnlPositive ? '#00D632' : '#FF334B'}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-700 font-bold">No Data</div>
                    )}
                </div>
            </Card>

            {/* 2. Trade Win % Gauge Card */}
            <Card className="flex flex-col justify-between bg-[#131316] border-gunmetal-700 min-h-[140px] p-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Trade Win %</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter mt-1">
                        {stats.winRate.toFixed(2)}%
                    </h2>
                </div>
                {/* SVG Semi-Circle Gauge */}
                <div className="flex justify-center items-end h-[50px] mt-1 relative">
                    <svg className="w-24 h-12" viewBox="0 0 100 50">
                        {/* Background track */}
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#222" strokeWidth="8" strokeLinecap="round" />
                        {/* Dynamic green/red segment */}
                        <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke={stats.winRate >= 50 ? '#00D632' : '#FF334B'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="126"
                            strokeDashoffset={126 - (126 * (stats.winRate / 100))}
                            className="transition-all duration-1000"
                        />
                    </svg>
                </div>
            </Card>

            {/* 3. Profit Factor Card */}
            <Card className="flex flex-col justify-between bg-[#131316] border-gunmetal-700 min-h-[140px] p-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Profit factor</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter mt-1">
                        {isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
                    </h2>
                </div>
                {/* Mini Ring Donut Gauge */}
                <div className="flex justify-center items-center h-[50px] mt-1">
                    <svg className="w-12 h-12" viewBox="0 0 36 36">
                        {/* Background track */}
                        <path
                            className="text-[#222]"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Dynamic Ring path */}
                        <path
                            className="transition-all duration-1000"
                            stroke={stats.profitFactor >= 1.0 ? '#00D632' : '#FF334B'}
                            strokeWidth="3.5"
                            strokeDasharray={`${Math.min(100, (stats.profitFactor / 2.0) * 100)}, 100`}
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                </div>
            </Card>

            {/* 4. Day Win % Gauge Card */}
            <Card className="flex flex-col justify-between bg-[#131316] border-gunmetal-700 min-h-[140px] p-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Day Win %</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter mt-1">
                        {dayWinRate.toFixed(2)}%
                    </h2>
                </div>
                {/* SVG Semi-Circle Gauge */}
                <div className="flex justify-center items-end h-[50px] mt-1 relative">
                    <svg className="w-24 h-12" viewBox="0 0 100 50">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#222" strokeWidth="8" strokeLinecap="round" />
                        <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke={dayWinRate >= 50 ? '#00D632' : '#FF334B'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="126"
                            strokeDashoffset={126 - (126 * (dayWinRate / 100))}
                            className="transition-all duration-1000"
                        />
                    </svg>
                </div>
            </Card>

            {/* 5. Avg win/loss trade Comparison Slider Card */}
            <Card className="flex flex-col justify-between bg-[#131316] border-gunmetal-700 min-h-[140px] p-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Avg win/loss trade</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter mt-1">
                        {avgWinLossRatio.toFixed(2)}
                    </h2>
                </div>
                {/* Horizontal win/loss comparison slider */}
                <div className="flex flex-col gap-1.5 mt-2">
                    <div className="w-full h-2 rounded-full overflow-hidden bg-gunmetal-800 flex border border-gunmetal-700">
                        {/* Green Winning bar */}
                        <div
                            className="bg-[#00D632] h-full transition-all duration-1000"
                            style={{
                                width: `${
                                    stats.averageWin === 0 && stats.averageLoss === 0
                                        ? 50
                                        : (stats.averageWin / (stats.averageWin + Math.abs(stats.averageLoss))) * 100
                                }%`
                            }}
                        />
                        {/* Red Losing bar */}
                        <div
                            className="bg-[#FF334B] h-full transition-all duration-1000 flex-1"
                        />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-black tracking-wide">
                        <span className="text-[#00D632]">${stats.averageWin.toFixed(0)}</span>
                        <span className="text-[#FF334B]">${stats.averageLoss.toFixed(0)}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};
