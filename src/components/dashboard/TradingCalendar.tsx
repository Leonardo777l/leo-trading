'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTradeStore, useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
} from 'date-fns';

export const TradingCalendar = () => {
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
        const map = new Map<string, { netProfit: number; count: number }>();
        trades.forEach(trade => {
            try {
                const date = new Date(trade.date);
                if (isNaN(date.getTime())) return;

                // Use a normalized format for the map key
                const key = format(date, 'yyyy-MM-dd');
                const existing = map.get(key) || { netProfit: 0, count: 0 };
                map.set(key, {
                    netProfit: existing.netProfit + trade.netProfit,
                    count: existing.count + 1
                });
            } catch {
                // Ignore invalid dates
            }
        });
        return map;
    }, [trades]);

    if (!mounted) {
        return (
            <Card className="flex flex-col gap-4 h-full min-h-[300px] overflow-hidden">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Trading Calendar</h3>
                        <p className="text-xs text-gray-400">Loading timeframe...</p>
                    </div>
                </div>
                <div className="flex-1 w-full bg-gunmetal-900/10 animate-pulse rounded-xl" />
            </Card>
        );
    }

    // Build calendar grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const cloneDay = day;
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = dailyData.get(dateKey);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            days.push(
                <div
                    key={day.toString()}
                    className={`relative p-2 flex flex-col items-center justify-between border-b border-r border-gunmetal-800/50 min-h-[90px] transition-all duration-300
                        ${!isCurrentMonth ? 'text-gray-600 bg-gunmetal-900/20' : 'text-gray-300'}
                        ${isCurrentDay ? 'bg-gunmetal-800/40' : ''}
                        hover:bg-gunmetal-800/60 cursor-default group
                    `}
                >
                    <span className={`text-[11px] font-bold self-end mb-1 ${isCurrentDay ? 'bg-target text-black px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(0,200,5,0.5)]' : ''}`}>
                        {formattedDate}
                    </span>

                    {dayData ? (
                        <div className={`w-full text-center rounded-lg px-1 py-1.5 mt-auto flex flex-col items-center justify-center transition-all duration-300
                            ${dayData.netProfit >= 0
                                ? 'bg-gradient-to-b from-target/20 to-target/5 border border-target/40 shadow-[inset_0_1px_4px_rgba(0,200,5,0.3)]'
                                : 'bg-gradient-to-b from-stop/20 to-stop/5 border border-stop/40 shadow-[inset_0_1px_4px_rgba(255,0,50,0.3)]'}
                        `}>
                            <span className={`text-[13px] font-black tracking-tight ${dayData.netProfit >= 0 ? 'text-target drop-shadow-[0_0_10px_rgba(0,200,5,1)]' : 'text-stop drop-shadow-[0_0_10px_rgba(255,0,50,1)]'}`}>
                                {dayData.netProfit >= 0 ? '+' : '-'}${Math.abs(dayData.netProfit).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 font-medium bg-gunmetal-900/95 px-2 py-0.5 border border-gunmetal-700 rounded-md shadow-lg z-10">
                                {dayData.count} trade{dayData.count !== 1 ? 's' : ''}
                            </span>
                        </div>
                    ) : (
                        <div className="w-full text-center mt-auto">
                            <span className="text-[10px] text-gray-600 font-medium">-</span>
                        </div>
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7 w-full border-b border-gunmetal-800/50 last:border-b-0" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <Card className="flex flex-col gap-4 h-full min-h-[480px] overflow-visible">
            <div className="flex items-center justify-between px-2 pt-2">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Trading Calendar</h3>
                    <p className="text-xs text-gray-400">Daily Net Profit tracking</p>
                </div>
                <div className="flex items-center gap-4 bg-gunmetal-900 rounded-lg p-1 border border-gunmetal-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-white hover:bg-gunmetal-800 rounded transition">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-gray-200 min-w-[120px] text-center uppercase tracking-wider">
                        {format(currentMonth, "MMM yyyy")}
                    </span>
                    <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-white hover:bg-gunmetal-800 rounded transition">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col border border-gunmetal-800/50 rounded-xl overflow-hidden bg-gunmetal-900/30 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 w-full border-b border-gunmetal-800/50 bg-gunmetal-900">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center py-2.5 border-r border-gunmetal-800/50 last:border-r-0">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Calendar Grid */}
                <div className="flex flex-col w-full flex-1">
                    {rows}
                </div>
            </div>
        </Card>
    );
};
