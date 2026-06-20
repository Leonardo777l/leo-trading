'use client';

import { useMemo } from 'react';
import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

export const AccountBalanceCard = () => {
    const trades = useActiveTrades();

    // Calculate account balance history
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
        
        let balance = 0;
        return sortedDates.map(dateKey => {
            balance += dailyProfitMap.get(dateKey) || 0;
            return {
                dateStr: format(new Date(dateKey), 'MM/dd/yy'),
                balance
            };
        });
    }, [trades]);

    return (
        <Card className="flex flex-col bg-[#131316] border-gunmetal-700 min-h-[380px] p-5 justify-between">
            {/* Header info */}
            <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Account balance</span>
                    <span className="text-xs text-gray-400 cursor-help border border-gunmetal-700 w-5 h-5 flex items-center justify-center rounded-full font-bold">?</span>
                </div>
                {/* Custom Legend */}
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        <span>Account Balance</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Deposits / Withdrawals</span>
                    </div>
                </div>
            </div>

            {/* Area Chart of Account Balance */}
            <div className="w-full flex-1 h-[240px] mt-4 relative">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="purpleAreaColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
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
                                        <span key="balance" className={numVal >= 0 ? 'text-[#00D632]' : 'text-[#FF334B]'}>
                                            ${numVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>,
                                        'Balance'
                                    ];
                                }}
                            />
                            {/* Static horizontal line representing deposits/withdrawals baseline */}
                            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} />
                            
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#7c3aed"
                                strokeWidth={2}
                                fill="url(#purpleAreaColor)"
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
