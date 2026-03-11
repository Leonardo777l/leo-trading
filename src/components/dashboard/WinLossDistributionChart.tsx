'use client';

import { useTradeStore } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
    TP: '#00C805', // Target
    SL: '#FF0032', // Stop
    BE: '#3B82F6'  // Break Even
};

export const WinLossDistributionChart = () => {
    const trades = useTradeStore(state => state.trades);

    const data = useMemo(() => {
        let tp = 0;
        let sl = 0;
        let be = 0;

        trades.forEach(t => {
            if (t.outcome === 'TP') tp++;
            else if (t.outcome === 'SL') sl++;
            else be++;
        });

        return [
            { name: 'Targets', value: tp, color: COLORS.TP },
            { name: 'Stops', value: sl, color: COLORS.SL },
            { name: 'Break Evens', value: be, color: COLORS.BE },
        ].filter(d => d.value > 0);
    }, [trades]);

    if (trades.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-6 h-full min-h-[300px]">
                <div className="w-12 h-12 rounded-full border border-gunmetal-700 bg-gunmetal-800 flex items-center justify-center mb-3">
                    <span className="text-xl">📊</span>
                </div>
                <h3 className="text-white text-sm font-semibold">No trade distribution yet</h3>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4 h-full min-h-[300px]">
            <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Trade Distribution</h3>
                <p className="text-xs text-gray-400">Wins vs Losses by volume</p>
            </div>

            <div className="flex-1 w-full h-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`${value} Trades`, '']}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-xs text-gray-300 ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
