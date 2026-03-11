'use client';

import { useTradeStore } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const PerformanceByDayChart = () => {
    const trades = useTradeStore(state => state.trades);

    const data = useMemo(() => {
        // Initialize an accumulator for each day
        const dayMap = new Map<string, number>();
        DAYS_OF_WEEK.forEach(day => dayMap.set(day, 0));

        trades.forEach(trade => {
            try {
                // Determine day of the week from ISO date string
                const timestamp = new Date(trade.date);
                if (isNaN(timestamp.getTime())) return; // skip invalid dates

                const dayName = format(timestamp, 'EEEE');
                if (dayMap.has(dayName)) {
                    dayMap.set(dayName, dayMap.get(dayName)! + trade.netProfit);
                }
            } catch {
                // Ignore parsing errors for malformed legacy data
            }
        });

        // Filter out weekends if they have 0 volume to keep the chart clean, like TradeZella
        return DAYS_OF_WEEK.map(day => ({
            name: day.substring(0, 3).toUpperCase(),
            value: Number(dayMap.get(day)?.toFixed(2)) || 0
        })).filter(d => ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(d.name) || d.value !== 0);

    }, [trades]);

    if (trades.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-6 h-full min-h-[300px]">
                <div className="w-12 h-12 rounded-full border border-gunmetal-700 bg-gunmetal-800 flex items-center justify-center mb-3">
                    <span className="text-xl">📅</span>
                </div>
                <h3 className="text-white text-sm font-semibold">No day performance data yet</h3>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4 h-full min-h-[300px]">
            <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Performance by Day</h3>
                <p className="text-xs text-gray-400">Net Profit distribution throughout the week</p>
            </div>

            <div className="flex-1 w-full h-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <XAxis
                            dataKey="name"
                            stroke="#4B5563"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#4B5563"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: '#1F2937', opacity: 0.4 }}
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Net Profit']}
                            labelStyle={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px' }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 4, 4]}
                        >
                            {
                                data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#00C805' : '#FF0032'} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
