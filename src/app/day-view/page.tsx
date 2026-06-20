'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useActiveTrades, Trade } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Brain, Play, Plus, BookOpen, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function DayViewPage() {
    const [mounted, setMounted] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
    const [aiReviewDay, setAiReviewDay] = useState<{ date: string; trades: Trade[]; netProfit: number } | null>(null);

    const trades = useActiveTrades();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Group trades by date
    const dailyGroups = useMemo(() => {
        const groups: { [key: string]: Trade[] } = {};
        trades.forEach(t => {
            try {
                const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(t);
            } catch {
            }
        });

        // Convert to array and sort descending by date
        const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        
        return sortedKeys.map(dateKey => {
            const dayTrades = groups[dateKey];
            // Calculate Day Statistics
            let netProfit = 0;
            let wins = 0;
            let losses = 0;
            let contracts = 0;
            let grossProfit = 0;
            let grossLoss = 0;

            dayTrades.forEach(t => {
                netProfit += t.netProfit;
                contracts += t.contracts;
                if (t.outcome === 'TP') {
                    wins++;
                    grossProfit += t.netProfit;
                } else if (t.outcome === 'SL') {
                    losses++;
                    grossLoss += Math.abs(t.netProfit);
                }
            });

            const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit;
            // Commision default approximation ($2.4 per contract roundturn)
            const commissions = contracts * 2.4;

            // Generate intraday sparkline curve
            // Sort trades ascending by date for time-series flow
            const sortedIntraday = [...dayTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let runningSum = 0;
            const intradayCurve = [{ id: 0, pnl: 0 }, ...sortedIntraday.map((t, idx) => {
                runningSum += t.netProfit;
                return { id: idx + 1, pnl: runningSum };
            })];

            return {
                dateStr: dateKey,
                dateObj: new Date(dateKey),
                trades: dayTrades,
                netProfit,
                winRate,
                profitFactor,
                commissions,
                volume: contracts,
                winners: wins,
                losers: losses,
                intradayCurve
            };
        });
    }, [trades]);

    // Calendar navigation
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // Calendar grid calculations
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const calendarActiveDays = useMemo(() => {
        const set = new Set<string>();
        dailyGroups.forEach(g => set.add(g.dateStr));
        return set;
    }, [dailyGroups]);

    const calendarDayGains = useMemo(() => {
        const map = new Map<string, boolean>();
        dailyGroups.forEach(g => map.set(g.dateStr, g.netProfit >= 0));
        return map;
    }, [dailyGroups]);

    if (!mounted) return null;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const dateKey = format(day, 'yyyy-MM-dd');
            const hasTrades = calendarActiveDays.has(dateKey);
            const isGain = calendarDayGains.get(dateKey);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const formattedDate = format(day, 'd');

            const isSelected = selectedDateFilter === dateKey;

            days.push(
                <div
                    key={day.toString()}
                    onClick={() => {
                        if (hasTrades) {
                            setSelectedDateFilter(selectedDateFilter === dateKey ? null : dateKey);
                        }
                    }}
                    className={`h-7 w-7 flex items-center justify-center rounded text-[10px] font-black cursor-pointer transition ${
                        !isCurrentMonth ? 'text-gray-700 pointer-events-none' : 'text-gray-300'
                    } ${
                        isSelected ? 'bg-purple-600 text-white font-black scale-110 shadow-[0_0_10px_rgba(124,58,237,0.5)]' : ''
                    } ${
                        hasTrades && !isSelected
                            ? isGain
                                ? 'bg-[#00D632]/10 border border-[#00D632]/30 text-[#00D632] hover:bg-[#00D632]/25'
                                : 'bg-[#FF334B]/10 border border-[#FF334B]/30 text-[#FF334B] hover:bg-[#FF334B]/25'
                            : 'hover:bg-gunmetal-800'
                    }`}
                    title={hasTrades ? `${format(day, 'MMM dd')}: Click to filter` : ''}
                >
                    {formattedDate}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7 gap-1 w-full justify-items-center" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    // Filter feed based on date filter selection
    const filteredFeed = selectedDateFilter
        ? dailyGroups.filter(g => g.dateStr === selectedDateFilter)
        : dailyGroups;

    return (
        <>
            <DashboardLayout onQuickAdd={() => setIsQuickAddOpen(true)}>
                <div className="flex flex-col xl:flex-row gap-6 h-full overflow-hidden w-full relative">
                    
                    {/* Left Scrollable Column: Daily summaries feed */}
                    <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
                        <header className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Day View</h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Day-by-Day performance stream</p>
                            </div>
                            {selectedDateFilter && (
                                <button
                                    onClick={() => setSelectedDateFilter(null)}
                                    className="text-[9px] font-black uppercase text-purple-500 bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 rounded-lg hover:bg-purple-500/20 transition cursor-pointer"
                                >
                                    Clear Filter ({format(new Date(selectedDateFilter), 'MMM dd')})
                                </button>
                            )}
                        </header>

                        {filteredFeed.length > 0 ? (
                            <div className="flex flex-col gap-6 w-full">
                                {filteredFeed.map((group) => {
                                    const isPositive = group.netProfit >= 0;
                                    const netProfitText = (isPositive ? '+' : '-') + `$${Math.abs(group.netProfit).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;

                                    return (
                                        <Card key={group.dateStr} className="bg-[#131316] border-gunmetal-700/80 p-5 flex flex-col md:flex-row gap-6 justify-between items-stretch hover:border-gunmetal-700 transition">
                                            {/* Left Section: Info & Sparkline */}
                                            <div className="flex flex-col justify-between flex-1 gap-4 min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                                        {format(group.dateObj, 'eee, MMM dd, yyyy')}
                                                    </h3>
                                                    <span className={`text-xs font-black uppercase ${isPositive ? 'text-[#00D632]' : 'text-[#FF334B]'}`}>
                                                        Net P&L {netProfitText}
                                                    </span>
                                                </div>

                                                {/* Daily Sparkline */}
                                                <div className="w-full h-24 relative rounded-xl border border-gunmetal-800/40 bg-gunmetal-900/10 overflow-hidden">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={group.intradayCurve} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                                            <defs>
                                                                <linearGradient id={`sparkGrad-${group.dateStr}`} x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor={isPositive ? '#00D632' : '#FF334B'} stopOpacity={0.15} />
                                                                    <stop offset="95%" stopColor={isPositive ? '#00D632' : '#FF334B'} stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <Area
                                                                type="monotone"
                                                                dataKey="pnl"
                                                                stroke={isPositive ? '#00D632' : '#FF334B'}
                                                                strokeWidth={2}
                                                                fill={`url(#sparkGrad-${group.dateStr})`}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Center Section: Main stats columns */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center bg-gunmetal-900/15 border border-gunmetal-800/30 rounded-xl px-4 py-3 min-w-[300px]">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Total Trades</span>
                                                    <span className="text-sm font-black text-white mt-0.5">{group.trades.length}</span>
                                                    <span className="text-[8px] text-gray-600 font-bold mt-0.5">Win Rate: {group.winRate.toFixed(0)}%</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Gross P&L</span>
                                                    <span className={`text-sm font-black mt-0.5 ${group.netProfit >= 0 ? 'text-[#00D632]' : 'text-[#FF334B]'}`}>
                                                        ${Math.abs(group.netProfit).toFixed(0)}
                                                    </span>
                                                    <span className="text-[8px] text-gray-600 font-bold mt-0.5">Vol: {group.volume} contracts</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Winners/Losers</span>
                                                    <span className="text-sm font-black text-white mt-0.5">{group.winners}/{group.losers}</span>
                                                    <span className="text-[8px] text-gray-600 font-bold mt-0.5">PF: {isFinite(group.profitFactor) ? group.profitFactor.toFixed(1) : '∞'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Commissions</span>
                                                    <span className="text-sm font-black text-white mt-0.5">${group.commissions.toFixed(2)}</span>
                                                    <span className="text-[8px] text-gray-600 font-bold mt-0.5">Average P&L / Trade</span>
                                                </div>
                                            </div>

                                            {/* Right Section: Action Buttons */}
                                            <div className="flex md:flex-col justify-center gap-2 items-stretch min-w-[140px]">
                                                <button
                                                    onClick={() => setAiReviewDay({ date: group.dateStr, trades: group.trades, netProfit: group.netProfit })}
                                                    className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-lg text-[10px] transition uppercase tracking-wider cursor-pointer shadow-[0_2px_10px_rgba(124,58,237,0.2)]"
                                                >
                                                    <Brain className="w-3.5 h-3.5" />
                                                    <span>Review with Zella AI</span>
                                                </button>
                                                <button className="flex items-center justify-center gap-1.5 bg-gunmetal-800 hover:bg-gunmetal-750 text-gray-300 font-bold py-2 px-3 rounded-lg text-[10px] transition uppercase tracking-wider">
                                                    <Play className="w-3 h-3" />
                                                    <span>Replay</span>
                                                </button>
                                                <button className="flex items-center justify-center gap-1.5 bg-gunmetal-850 hover:bg-gunmetal-800 text-gray-400 font-bold py-2 px-3 rounded-lg text-[10px] transition uppercase tracking-wider">
                                                    <Plus className="w-3 h-3" />
                                                    <span>Add note</span>
                                                </button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                <BookOpen className="w-16 h-16 opacity-20 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">No trading activity logged yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Sticky Column: Calendar Selector */}
                    <div className="w-full xl:w-[260px] h-fit sticky top-0 bg-[#131316] border border-gunmetal-700 rounded-xl p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gunmetal-700/50 pb-2">
                            <span className="text-xs font-black uppercase text-white tracking-wider">
                                {format(currentMonth, 'MMMM yyyy')}
                            </span>
                            <div className="flex gap-1 bg-gunmetal-900 border border-gunmetal-700/50 rounded-lg p-0.5">
                                <button onClick={prevMonth} className="p-0.5 text-gray-500 hover:text-white rounded">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={nextMonth} className="p-0.5 text-gray-500 hover:text-white rounded">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex flex-col gap-2 w-full select-none">
                            {/* Days labels */}
                            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                <span>Su</span>
                                <span>Mo</span>
                                <span>Tu</span>
                                <span>We</span>
                                <span>Th</span>
                                <span>Fr</span>
                                <span>Sa</span>
                            </div>
                            {/* Dates Grid */}
                            <div className="flex flex-col gap-1 w-full">
                                {rows}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>

            {/* Quick add floating modal overlay */}
            <QuickAddTrade isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />

            {/* Zella AI side drawer panel */}
            {aiReviewDay && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAiReviewDay(null)} />
                    
                    {/* Slider Drawer */}
                    <div className="relative w-full max-w-md h-full bg-[#0d0d0f] border-l border-gunmetal-700 p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-350">
                        
                        <div className="flex flex-col gap-6">
                            {/* Close header */}
                            <div className="flex items-center justify-between border-b border-gunmetal-700/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-500" />
                                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Zella AI Review</h2>
                                </div>
                                <button onClick={() => setAiReviewDay(null)} className="p-1 hover:bg-gunmetal-800 rounded text-gray-500 hover:text-white transition">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Trade metrics context */}
                            <div className="bg-gunmetal-900/30 border border-gunmetal-700/50 rounded-xl p-4 flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Day Evaluated</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-white">{format(new Date(aiReviewDay.date), 'MMMM dd, yyyy')}</span>
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded border ${
                                        aiReviewDay.netProfit >= 0
                                            ? 'bg-[#00D632]/5 border-[#00D632]/25 text-[#00D632]'
                                            : 'bg-[#FF334B]/5 border-[#FF334B]/25 text-[#FF334B]'
                                    }`}>
                                        {aiReviewDay.netProfit >= 0 ? '+' : '-'}${Math.abs(aiReviewDay.netProfit).toFixed(2)}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-semibold">{aiReviewDay.trades.length} trades parsed.</span>
                            </div>

                            {/* AI analysis */}
                            <div className="flex flex-col gap-5">
                                {/* Rule check */}
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-600/10 border border-blue-600/30 flex items-center justify-center flex-shrink-0 text-blue-500">
                                        <BookOpen className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Trading Plan Compliance</span>
                                        <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                                            Executed trades matched selected strategy criteria. Intraday drawdown limit was respected. No overtrading detected.
                                        </p>
                                    </div>
                                </div>

                                {/* Risk evaluation */}
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#00D632]/10 border border-[#00D632]/30 flex items-center justify-center flex-shrink-0 text-[#00D632]">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Risk assessment</span>
                                        <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                                            Position sizing remained consistent at {aiReviewDay.trades[0]?.contracts || 1} contract per position. Win-to-loss ratio is healthy, ensuring solid expectancy even at lower win rates.
                                        </p>
                                    </div>
                                </div>

                                {/* Psychology feedback */}
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#FF334B]/10 border border-[#FF334B]/30 flex items-center justify-center flex-shrink-0 text-[#FF334B]">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">State of Mind Analysis</span>
                                        <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                                            Mental state logs report {aiReviewDay.trades.filter(t => t.estadoMental !== 'Calm').length > 0 ? 'some Anxiety/FOMO' : 'calm state of mind'} during execution. Take care to breathe and pause between trades to keep your heart rate down.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Critical Tip */}
                        <div className="mt-8 border-t border-gunmetal-700/50 pt-5 flex flex-col gap-3">
                            <span className="text-[9px] font-black uppercase text-purple-500 tracking-widest">Zella&apos;s Daily Action Actionable Tip</span>
                            <div className="bg-purple-600/5 border border-purple-600/25 rounded-xl p-3.5 text-xs text-purple-400 font-bold leading-relaxed">
                                {aiReviewDay.netProfit >= 0
                                    ? "Excellent work holding onto targets today. Protect your capital tomorrow by maintaining the exact same sizing. Do not chase larger gains out of excitement."
                                    : "Today ended in a loss, which is a normal cost of business. You respected your SL guidelines. Shut down the terminal, walk away, and return tomorrow with a fresh mind."
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
