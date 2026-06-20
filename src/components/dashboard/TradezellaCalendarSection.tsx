'use client';

import { useState, useMemo, useEffect } from 'react';
import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isToday,
    getWeekOfMonth,
} from 'date-fns';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, XAxis as ScatterXAxis, YAxis as ScatterYAxis, ZAxis as ScatterZAxis, Cell
} from 'recharts';

export const TradezellaCalendarSection = () => {
    const trades = useActiveTrades();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // Aggregate trades by date
    const dailyData = useMemo(() => {
        const map = new Map<string, { netProfit: number; totalTrades: number; winningTrades: number }>();
        trades.forEach(trade => {
            try {
                const date = new Date(trade.date);
                if (isNaN(date.getTime())) return;

                const key = format(date, 'yyyy-MM-dd');
                const existing = map.get(key) || { netProfit: 0, totalTrades: 0, winningTrades: 0 };
                map.set(key, {
                    netProfit: existing.netProfit + trade.netProfit,
                    totalTrades: existing.totalTrades + 1,
                    winningTrades: existing.winningTrades + (trade.outcome === 'TP' ? 1 : 0)
                });
            } catch {}
        });
        return map;
    }, [trades]);

    // Calculate Weekly Stats for current month
    const weeklyStats = useMemo(() => {
        const stats = Array(5).fill(0).map((_, i) => ({ weekNum: i + 1, netProfit: 0, daysCount: new Set<string>() }));
        
        trades.forEach(trade => {
            try {
                const date = new Date(trade.date);
                if (isNaN(date.getTime())) return;

                if (isSameMonth(date, currentMonth)) {
                    const weekIdx = Math.min(4, getWeekOfMonth(date) - 1);
                    if (weekIdx >= 0) {
                        stats[weekIdx].netProfit += trade.netProfit;
                        stats[weekIdx].daysCount.add(format(date, 'yyyy-MM-dd'));
                    }
                }
            } catch {}
        });

        return stats.map(s => ({
            weekLabel: `Week ${s.weekNum}`,
            netProfit: s.netProfit,
            days: s.daysCount.size
        }));
    }, [trades, currentMonth]);

    // Drawdown Calculation over Time
    const drawdownData = useMemo(() => {
        const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let balance = 0;
        let peak = 0;

        return sorted.map((t, idx) => {
            balance += t.netProfit;
            if (balance > peak) peak = balance;
            const drawdown = balance - peak; // <= 0
            
            return {
                id: idx,
                dateStr: format(new Date(t.date), 'MM/dd'),
                drawdown
            };
        });
    }, [trades]);

    // Scatter Plot data for Trade Time Performance
    const scatterData = useMemo(() => {
        return trades.map((t) => {
            try {
                const dateObj = new Date(t.date);
                if (isNaN(dateObj.getTime())) return null;

                const hours = dateObj.getHours() + (dateObj.getMinutes() / 60);
                return {
                    time: hours,
                    pnl: t.netProfit,
                    instrument: t.instrument || 'MNQ',
                    outcome: t.outcome,
                    timeStr: format(dateObj, 'hh:mm a')
                };
            } catch {
                return null;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).filter((item): item is { time: number; pnl: number; instrument: string; outcome: any; timeStr: string } => item !== null);
    }, [trades]);

    if (!mounted) return null;

    // Calendar Calculations
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = dailyData.get(dateKey);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);
            const formattedDate = format(day, 'd');

            const winRate = dayData && dayData.totalTrades > 0
                ? (dayData.winningTrades / dayData.totalTrades) * 100
                : 0;

            days.push(
                <div
                    key={day.toString()}
                    className={`relative p-2 flex flex-col justify-between border-b border-r border-gunmetal-700/50 min-h-[90px] transition-all ${
                        !isCurrentMonth ? 'text-gray-700 bg-gunmetal-900/10' : 'text-gray-300'
                    } ${isCurrentDay ? 'bg-gunmetal-800/30' : ''} hover:bg-gunmetal-800/40`}
                >
                    <span className={`text-[10px] font-black self-end ${isCurrentDay ? 'bg-blue-600 text-white px-1.5 py-0.5 rounded' : 'text-gray-500'}`}>
                        {formattedDate}
                    </span>

                    {dayData ? (
                        <div className={`w-full rounded p-1 flex flex-col items-center justify-center mt-2 ${
                            dayData.netProfit >= 0 ? 'bg-[#00D632]/5 border border-[#00D632]/20' : 'bg-[#FF334B]/5 border border-[#FF334B]/20'
                        }`}>
                            <span className={`text-[11px] font-black ${dayData.netProfit >= 0 ? 'text-[#00D632]' : 'text-[#FF334B]'}`}>
                                {dayData.netProfit >= 0 ? '+' : '-'}${Math.abs(dayData.netProfit).toFixed(0)}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold mt-0.5">
                                {dayData.totalTrades} trade{dayData.totalTrades > 1 ? 's' : ''} • {winRate.toFixed(0)}%
                            </span>
                        </div>
                    ) : (
                        <div className="w-full text-center mt-auto pb-1 text-[10px] text-gray-700 font-bold">-</div>
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7 w-full border-b border-gunmetal-700/30 last:border-b-0" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    // Monthly stats
    const totalMonthStats = weeklyStats.reduce((acc, w) => ({
        profit: acc.profit + w.netProfit,
        days: acc.days + w.days
    }), { profit: 0, days: 0 });

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
            {/* Left Panel: Calendar Grid & Weekly Stats (2/3 width) */}
            <Card className="xl:col-span-2 bg-[#131316] border-gunmetal-700 p-5 flex flex-col">
                {/* Header row */}
                <div className="flex items-center justify-between pb-4 border-b border-gunmetal-700/50">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-white uppercase tracking-wider">
                            {format(currentMonth, "MMMM yyyy")}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-[#00D632]/10 border border-[#00D632]/25 text-[#00D632] px-2.5 py-0.5 rounded font-black">
                                {totalMonthStats.profit >= 0 ? '+' : '-'}${Math.abs(totalMonthStats.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[10px] bg-blue-600/10 border border-blue-600/25 text-blue-500 px-2.5 py-0.5 rounded font-black">
                                {totalMonthStats.days} Day{totalMonthStats.days !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    {/* Month selector controls */}
                    <div className="flex items-center gap-1 bg-gunmetal-900 rounded-lg p-1 border border-gunmetal-700/50">
                        <button onClick={prevMonth} className="p-1 hover:bg-gunmetal-850 hover:text-white rounded transition text-gray-500">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-gunmetal-850 hover:text-white rounded transition text-gray-500">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row w-full mt-4 gap-4 flex-1">
                    {/* Calendar grid */}
                    <div className="flex-1 border border-gunmetal-700/40 rounded-xl overflow-hidden bg-gunmetal-900/10">
                        {/* Weekday Titles */}
                        <div className="grid grid-cols-7 w-full border-b border-gunmetal-700/30 bg-gunmetal-900/50">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                <div key={d} className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center py-2">
                                    {d}
                                </div>
                            ))}
                        </div>
                        {/* Grid */}
                        <div className="flex flex-col w-full">
                            {rows}
                        </div>
                    </div>

                    {/* Weekly Stats Panel */}
                    <div className="w-full md:w-[160px] flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Weekly stats</span>
                        {weeklyStats.map((w, idx) => {
                            const isWin = w.netProfit >= 0;
                            return (
                                <div
                                    key={idx}
                                    className="bg-gunmetal-900/40 border border-gunmetal-700/50 rounded-xl p-3 flex flex-col gap-1 text-xs transition hover:border-gunmetal-700"
                                >
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">{w.weekLabel}</span>
                                    <span className={`text-sm font-black ${isWin ? 'text-[#00D632]' : 'text-[#FF334B]'}`}>
                                        {isWin ? '+' : '-'}${Math.abs(w.netProfit).toFixed(0)}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-semibold">{w.days} Active day{w.days !== 1 ? 's' : ''}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Right Panel: Drawdown Chart & Scatter Plot (1/3 width) */}
            <div className="flex flex-col gap-6">
                {/* 1. Drawdown Chart */}
                <Card className="bg-[#131316] border-gunmetal-700 p-5 flex flex-col min-h-[220px] justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-gunmetal-700/40">
                        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Drawdown</span>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-600" />
                    </div>

                    {/* Area Drawdown chart */}
                    <div className="w-full h-[120px] mt-2 relative">
                        {drawdownData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={drawdownData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF334B" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#FF334B" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c21" vertical={false} />
                                    <XAxis dataKey="dateStr" stroke="#555" fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                                    <YAxis stroke="#555" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} tick={{ fill: '#71717a' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#131316', border: '1px solid #27272A', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: 10, fontWeight: 'bold' }}
                                        labelStyle={{ color: '#888', fontSize: 9 }}
                                    />
                                    <Area type="monotone" dataKey="drawdown" stroke="#FF334B" strokeWidth={1.5} fill="url(#drawdownGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-700">No drawdown activity</div>
                        )}
                    </div>
                </Card>

                {/* 2. Trade Time Performance Scatter Plot */}
                <Card className="bg-[#131316] border-gunmetal-700 p-5 flex flex-col min-h-[220px] justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-gunmetal-700/40">
                        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Trade time performance</span>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-600" />
                    </div>

                    <div className="w-full h-[120px] mt-2 relative">
                        {scatterData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                    <CartesianGrid stroke="#1c1c21" />
                                    <ScatterXAxis
                                        type="number"
                                        dataKey="time"
                                        name="Time"
                                        domain={[8.5, 17.5]}
                                        stroke="#555"
                                        fontSize={8}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => {
                                            const hr = Math.floor(v);
                                            const min = Math.round((v - hr) * 60);
                                            return `${hr}:${min === 0 ? '00' : min}`;
                                        }}
                                        tick={{ fill: '#71717a' }}
                                    />
                                    <ScatterYAxis
                                        type="number"
                                        dataKey="pnl"
                                        name="Profit"
                                        stroke="#555"
                                        fontSize={8}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `$${v}`}
                                        tick={{ fill: '#71717a' }}
                                    />
                                    <ScatterZAxis type="number" range={[16, 16]} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ backgroundColor: '#131316', border: '1px solid #27272A', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: 10 }}
                                        labelStyle={{ display: 'none' }}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(val: any, name: any, props: any) => {
                                            if (name === 'Profit') return [`$${val.toFixed(2)}`, 'Profit'];
                                            return [`${props.payload.timeStr} (${props.payload.instrument})`, 'Time'];
                                        }}
                                    />
                                    <Scatter name="Trades" data={scatterData}>
                                        {scatterData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.pnl >= 0 ? '#00D632' : '#FF334B'}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-700">No time data available</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
