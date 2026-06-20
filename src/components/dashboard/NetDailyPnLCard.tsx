'use client';

import { useMemo } from 'react';
import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

export const NetDailyPnLCard = () => {
    const trades = useActiveTrades();

    // Group profits by date and sort
    const chartData = useMemo(() => {
        if (trades.length === 0) return [];

        const dailyProfitMap = new Map<string, number>();
        trades.forEach(t => {
            try {
                const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
                const val = dailyProfitMap.get(dateKey) || 0;
                dailyProfitMap.set(dateKey, val + t.netProfit);
            } catch {}
        });

        const sortedDates = Array.from(dailyProfitMap.keys()).sort();
        
        return sortedDates.map(dateKey => ({
            dateStr: format(new Date(dateKey), 'MM/dd/yy'),
            netProfit: dailyProfitMap.get(dateKey) || 0
        }));
    }, [trades]);

    return (
        <Card className="flex flex-col bg-[#131316] border-gunmetal-700 min-h-[380px] p-5 justify-between">
            {/* Header Title */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Net daily P&L</span>
                <span className="text-xs text-gray-400 cursor-help border border-gunmetal-700 w-5 h-5 flex items-center justify-center rounded-full font-bold">?</span>
            </div>

            {/* Daily Return Bar Chart */}
            <div className="w-full flex-1 h-[260px] mt-4 relative">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                                formatter={(value: any) => [
                                    <span key="net-pnl" className={value >= 0 ? 'text-[#00D632]' : 'text-[#FF334B]'}>
                                        ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>,
                                    'Net Return'
                                ]}
                            />
                            <ReferenceLine y={0} stroke="#27272a" strokeWidth={1} />
                            <Bar dataKey="netProfit" radius={[2, 2, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.netProfit >= 0 ? '#00D632' : '#FF334B'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
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
