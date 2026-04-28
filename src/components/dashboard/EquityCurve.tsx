'use client';

import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

export const EquityCurve = () => {
    const trades = useActiveTrades();

    if (trades.length === 0) {
        return (
            <Card className="h-full min-h-[300px] flex items-center justify-center text-gray-500">
                <p>No data to display equity curve.</p>
            </Card>
        );
    }

    // Sort trades ascending by date for cumulative calculation
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulative = 0;
    const data = sortedTrades.map((t, index) => {
        cumulative += t.netProfit;
        return {
            index: index + 1,
            name: format(new Date(t.date), 'MMM dd'),
            cumulative,
            netProfit: t.netProfit
        };
    });

    // Add initial state 0
    const chartData = [
        { index: 0, name: 'Start', cumulative: 0, netProfit: 0 },
        ...data
    ];

    const minVal = Math.min(...chartData.map(d => d.cumulative));
    const maxVal = Math.max(...chartData.map(d => d.cumulative));
    const padding = (maxVal - minVal) * 0.1 || 100;

    return (
        <Card className="h-full min-h-[350px] flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white tracking-tight">Acumulado (Equity Curve)</h3>
            </div>
            <div className="flex-1 w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 30, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#555"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                            dy={10}
                        />
                        <YAxis
                            stroke="#555"
                            fontSize={11}
                            width={70}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                            domain={[minVal - padding, maxVal + padding]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#131316',
                                border: '1px solid #27272A',
                                borderRadius: '8px',
                                color: '#fff',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#00D632' }}
                            labelStyle={{ color: '#888', marginBottom: '4px' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Acumulado']}
                        />
                        <ReferenceLine y={0} stroke="#555" strokeDasharray="3 3" />
                        <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#00D632"
                            strokeWidth={3}
                            dot={{ r: 0 }}
                            activeDot={{ r: 5, fill: '#00D632', stroke: '#131316', strokeWidth: 2 }}
                            animationDuration={1000}
                            animationEasing="ease-out"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
