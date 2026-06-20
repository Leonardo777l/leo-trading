'use client';

import { useMemo } from 'react';
import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

export const DailyCumulativePnLCard = () => {
    const trades = useActiveTrades();

    // Group and calculate cumulative daily P&L
    const chartData = useMemo(() => {
        if (trades.length === 0) return [];

        // Group profits by date
        const dailyProfitMap = new Map<string, number>();
        trades.forEach(t => {
            try {
                const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
                const val = dailyProfitMap.get(dateKey) || 0;
                dailyProfitMap.set(dateKey, val + t.netProfit);
            } catch {}
        });

        // Sort by date key
        const sortedDates = Array.from(dailyProfitMap.keys()).sort();
        
        let cumulative = 0;
        return sortedDates.map(dateKey => {
            cumulative += dailyProfitMap.get(dateKey) || 0;
            return {
                rawDate: new Date(dateKey),
                dateStr: format(new Date(dateKey), 'MM/dd/yy'),
                pnl: cumulative
            };
        });
    }, [trades]);

    // Find min and max values to calculate gradient split offset
    const gradientOffset = useMemo(() => {
        if (chartData.length === 0) return 0;
        const pnlValues = chartData.map(d => d.pnl);
        const max = Math.max(...pnlValues);
        const min = Math.min(...pnlValues);

        if (max <= 0) return 0;
        if (min >= 0) return 1;

        return max / (max - min);
    }, [chartData]);

    const isPositive = chartData.length > 0 && chartData[chartData.length - 1].pnl >= 0;

    return (
        <Card className="flex flex-col bg-[#131316] border-gunmetal-700 min-h-[420px] p-5 justify-between">
            {/* Header Title */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Daily net cumulative P&L</span>
                <span className="text-xs text-gray-400 cursor-help border border-gunmetal-700 w-5 h-5 flex items-center justify-center rounded-full font-bold">?</span>
            </div>

            {/* Area Chart with dynamic split-color gradient fill */}
            <div className="w-full flex-1 h-[280px] mt-4 relative">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="splitCumulativeColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset={gradientOffset} stopColor="#00D632" stopOpacity={0.35} />
                                    <stop offset={gradientOffset} stopColor="#FF334B" stopOpacity={0.35} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c21" vertical={false} />
                            <XAxis
                                dataKey="dateStr"
                                stroke="#555"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                minTickGap={30}
                                tick={{ fill: '#71717a', fontWeight: 'bold' }}
                            />
                            <YAxis
                                stroke="#555"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${val.toLocaleString()}`}
                                tick={{ fill: '#71717a', fontWeight: 'bold' }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#131316', border: '1px solid #27272A', borderRadius: '8px' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: 11 }}
                                labelStyle={{ color: '#888', marginBottom: '4px', fontSize: 10, fontWeight: 'bold' }}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => {
                                    const numVal = typeof value === 'number' ? value : 0;
                                    return [
                                        <span key="cumulative" className={numVal >= 0 ? 'text-[#00D632]' : 'text-[#FF334B]'}>
                                            ${numVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>,
                                        'Cumulative P&L'
                                    ];
                                }}
                            />
                            {/* Horizontal line at $0 */}
                            <ReferenceLine y={0} stroke="#27272a" strokeWidth={1} />
                            
                            <Area
                                type="monotone"
                                dataKey="pnl"
                                stroke={isPositive ? '#00D632' : '#FF334B'}
                                strokeWidth={2.5}
                                fill="url(#splitCumulativeColor)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                        No trade data logged
                    </div>
                )}
            </div>
        </Card>
    );
};
