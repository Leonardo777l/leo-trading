'use client';

import { useState, useMemo, useEffect } from 'react';
import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

const DEFAULT_HABITS = [
    { id: '1', text: 'Define Daily Drawdown & Risk Limit', completed: false },
    { id: '2', text: 'Check Economic Calendar / News releases', completed: false },
    { id: '3', text: 'Wait for setup validation (No FOMO)', completed: false },
    { id: '4', text: 'Log all trades in the journal', completed: false },
    { id: '5', text: 'Take screenshots of execution entries', completed: false },
    { id: '6', text: 'Perform end-of-day market review', completed: false },
];

export const ProgressTrackerCard = () => {
    const trades = useActiveTrades();
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [showList, setShowList] = useState(false);

    // Initialize checklist from localStorage or default
    useEffect(() => {
        const stored = localStorage.getItem('tradezella_daily_checklist');
        if (stored) {
            try {
                setChecklist(JSON.parse(stored));
            } catch {
                setChecklist(DEFAULT_HABITS);
            }
        } else {
            setChecklist(DEFAULT_HABITS);
        }
    }, []);

    const saveChecklist = (items: ChecklistItem[]) => {
        setChecklist(items);
        localStorage.setItem('tradezella_daily_checklist', JSON.stringify(items));
    };

    const toggleItem = (id: string) => {
        const updated = checklist.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        saveChecklist(updated);
    };

    const score = checklist.filter(i => i.completed).length;
    const totalItems = checklist.length || 6;

    // Calculate Grid dates (last 16 weeks)
    const gridDays = useMemo(() => {
        const totalWeeks = 16;
        const totalDays = totalWeeks * 7;
        const today = new Date();
        const start = startOfWeek(subDays(today, totalDays - 7));
        
        const daysArray: Date[] = [];
        for (let i = 0; i < totalDays; i++) {
            daysArray.push(addDays(start, i));
        }
        return daysArray;
    }, []);

    // Group trades by date to find activity intensity
    const dailyVolume = useMemo(() => {
        const map = new Map<string, number>();
        trades.forEach(t => {
            try {
                const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
                const val = map.get(dateKey) || 0;
                map.set(dateKey, val + t.contracts); // color intensity based on contracts traded
            } catch {}
        });
        return map;
    }, [trades]);

    // Format week headers (months)
    const monthHeaders = useMemo(() => {
        const headers: { label: string; index: number }[] = [];
        let prevMonth = '';
        
        // Check every Sunday to see if it starts a new month
        for (let w = 0; w < 16; w++) {
            const date = gridDays[w * 7];
            const currentMonthName = format(date, 'MMM');
            if (currentMonthName !== prevMonth) {
                headers.push({ label: currentMonthName, index: w });
                prevMonth = currentMonthName;
            }
        }
        return headers;
    }, [gridDays]);

    return (
        <Card className="flex flex-col bg-[#131316] border-gunmetal-700 min-h-[420px] p-5 justify-between relative overflow-visible">
            {/* Header info */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Progress tracker</span>
                <button
                    onClick={() => setShowList(!showList)}
                    className="flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20 transition uppercase tracking-wider"
                >
                    <span>{showList ? 'Hide details' : 'Daily checklist'}</span>
                    {showList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            </div>

            {/* Contribution Grid Section */}
            <div className="flex flex-col gap-2 mt-4 flex-1">
                {/* Month labels */}
                <div className="relative h-4 text-[9px] font-bold text-gray-500 flex uppercase tracking-wider pl-8">
                    {monthHeaders.map(h => (
                        <span
                            key={h.index}
                            className="absolute"
                            style={{ left: `${(h.index / 16) * 100 + 4}%` }}
                        >
                            {h.label}
                        </span>
                    ))}
                </div>

                {/* Day-of-week rows + squares grid */}
                <div className="flex gap-2 items-start justify-center">
                    {/* Day names */}
                    <div className="flex flex-col justify-between text-[9px] font-black text-gray-600 h-[106px] pt-1">
                        <span>Sun</span>
                        <span>Tue</span>
                        <span>Thu</span>
                        <span>Sat</span>
                    </div>

                    {/* Columns of weeks */}
                    <div className="grid grid-flow-col grid-rows-7 gap-1 flex-1">
                        {gridDays.map((date) => {
                            const dateKey = format(date, 'yyyy-MM-dd');
                            const volume = dailyVolume.get(dateKey) || 0;

                            // Determine opacity color based on volume (shades of Tradezella Blue)
                            let cellBg = 'bg-[#1c1c21]';
                            if (volume > 0) {
                                if (volume <= 2) cellBg = 'bg-blue-600/30';
                                else if (volume <= 5) cellBg = 'bg-blue-600/50';
                                else if (volume <= 10) cellBg = 'bg-blue-600/75';
                                else cellBg = 'bg-blue-500';
                            }

                            return (
                                <div
                                    key={dateKey}
                                    className={`w-3.5 h-3.5 rounded-sm border border-black/30 cursor-default hover:border-gray-500 transition-colors ${cellBg}`}
                                    title={`${format(date, 'MMM dd, yyyy')}: ${volume} contracts traded`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Legend indicator */}
                <div className="flex items-center justify-end gap-1.5 text-[8px] font-bold text-gray-600 mt-1 mr-1 uppercase">
                    <span>Less</span>
                    <div className="w-2.5 h-2.5 rounded bg-[#1c1c21] border border-black/30" />
                    <div className="w-2.5 h-2.5 rounded bg-blue-600/30 border border-black/30" />
                    <div className="w-2.5 h-2.5 rounded bg-blue-600/50 border border-black/30" />
                    <div className="w-2.5 h-2.5 rounded bg-blue-600/75 border border-black/30" />
                    <div className="w-2.5 h-2.5 rounded bg-blue-500 border border-black/30" />
                    <span>More</span>
                </div>
            </div>

            {/* Habit checklist details panel toggled open */}
            {showList && (
                <div className="absolute inset-x-5 bottom-24 top-12 bg-[#131316] border border-gunmetal-700/80 rounded-xl p-3 z-30 flex flex-col gap-2 overflow-y-auto custom-scrollbar shadow-2xl">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 border-b border-gunmetal-700/40 pb-1">Daily Trading Habits</h4>
                    {checklist.map(item => (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gunmetal-800 p-1.5 rounded transition text-xs font-semibold text-gray-300"
                        >
                            {item.completed ? (
                                <CheckSquare className="w-4 h-4 text-blue-500" />
                            ) : (
                                <Square className="w-4 h-4 text-gray-500" />
                            )}
                            <span className={item.completed ? 'line-through text-gray-500' : ''}>{item.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Checklist progress score */}
            <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-gunmetal-800/50 w-full">
                <div className="flex justify-between items-center text-xs font-black text-gray-400">
                    <span>Today&apos;s score</span>
                    <span className="text-white">{score}/{totalItems}</span>
                </div>

                {/* Score progress bar */}
                <div className="w-full bg-gunmetal-800 rounded-full h-2 overflow-hidden border border-gunmetal-700/30">
                    <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(score / totalItems) * 100}%` }}
                    />
                </div>
            </div>
        </Card>
    );
};
