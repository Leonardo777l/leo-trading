'use client';

import { useTradeStore, useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export const PsychologyHeatmap = () => {
    const trades = useActiveTrades();

    if (trades.length === 0) {
        return (
            <Card className="h-full min-h-[300px] flex items-center justify-center text-gray-500">
                <p>No data to display Heatmap.</p>
            </Card>
        );
    }

    // Aggregate wins and losses by Estado Mental
    const moodData: Record<string, { wins: number, losses: number }> = {
        Calm: { wins: 0, losses: 0 },
        Anxiety: { wins: 0, losses: 0 },
        FOMO: { wins: 0, losses: 0 }
    };

    trades.forEach(t => {
        if (!moodData[t.estadoMental]) {
            moodData[t.estadoMental] = { wins: 0, losses: 0 };
        }

        if (t.outcome === 'TP') moodData[t.estadoMental].wins++;
        else if (t.outcome === 'SL') moodData[t.estadoMental].losses++;
    });

    const chartData = [
        { name: 'Calm', Targets: moodData['Calm'].wins, Stops: moodData['Calm'].losses },
        { name: 'Anxiety', Targets: moodData['Anxiety'].wins, Stops: moodData['Anxiety'].losses },
        { name: 'FOMO', Targets: moodData['FOMO'].wins, Stops: moodData['FOMO'].losses }
    ].filter(d => d.Targets > 0 || d.Stops > 0);

    return (
        <Card className="h-full min-h-[300px] flex flex-col gap-2">
            <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Psychology vs Precision</h3>
                <p className="text-xs text-gray-500">Targets and Stops grouped by your Mental State</p>
            </div>
            <div className="flex-1 w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            contentStyle={{
                                backgroundColor: '#121212',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                            }}
                            itemStyle={{ fontWeight: 'bold' }}
                        />
                        <Bar dataKey="Targets" fill="#00C805" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1500} />
                        <Bar dataKey="Stops" fill="#FF0032" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1500} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
