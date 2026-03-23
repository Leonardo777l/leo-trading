
'use client';

import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { useMemo, useState } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthlyReturnMatrix = () => {
    const trades = useActiveTrades();
    const [initialBalance, setInitialBalance] = useState<number>(50000); // Default to $50k

    const { matrixData, years } = useMemo(() => {
        if (!trades.length) return { matrixData: {}, years: [] };

        // Group trades by year and month
        const grouped: Record<number, Record<number, number>> = {};

        trades.forEach(trade => {
            const date = new Date(trade.date);
            if (isNaN(date.getTime())) return;
            
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-11

            if (!grouped[year]) grouped[year] = {};
            if (!grouped[year][month]) grouped[year][month] = 0;

            grouped[year][month] += trade.netProfit;
        });

        const availableYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);
        return { matrixData: grouped, years: availableYears };
    }, [trades]);

    if (trades.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[300px]">
                <div className="w-16 h-16 bg-gunmetal-800 rounded-full flex items-center justify-center mb-4 border border-gunmetal-700">
                    <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No data yet</h3>
                <p className="text-gray-400 text-sm max-w-sm">Import or add trades to see your monthly returns matrix.</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-6 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        Monthly Return Matrix
                    </h3>
                    <p className="text-xs text-gray-400">Net Profit grouped by month and year.</p>
                </div>

                <div className="flex items-center gap-2 bg-gunmetal-900 px-3 py-1.5 rounded-lg border border-gunmetal-700">
                    <span className="text-xs text-gray-400">Account Size Base: $</span>
                    <input
                        type="number"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(Number(e.target.value) || 0)}
                        className="bg-transparent text-sm font-mono text-white w-20 outline-none focus:border-b border-target"
                    />
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 bg-gunmetal-900 border border-gunmetal-800 text-gray-400 font-semibold text-xs sticky left-0 z-10 w-24">Year</th>
                            {MONTHS.map(month => (
                                <th key={month} className="px-4 py-3 bg-gunmetal-900 border border-gunmetal-800 text-gray-400 font-semibold text-xs text-right min-w-[80px]">
                                    {month}
                                </th>
                            ))}
                            <th className="px-4 py-3 bg-gunmetal-900 border border-gunmetal-800 text-white font-bold text-xs text-right min-w-[100px]">YTD Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map(year => {
                            let ytdTotal = 0;

                            return (
                                <tr key={year} className="hover:bg-gunmetal-800/30 transition-colors">
                                    <td className="px-4 py-3 border border-gunmetal-800 bg-gunmetal-900 sticky left-0 z-10 font-bold text-white">
                                        {year}
                                    </td>

                                    {MONTHS.map((month, index) => {
                                        const netProfit = matrixData[year]?.[index] || 0;
                                        ytdTotal += netProfit;
                                        const yieldPercentage = initialBalance > 0 ? (netProfit / initialBalance) * 100 : 0;

                                        // Color intensity logic based on yield
                                        let bgColor = '';
                                        let textColor = 'text-gray-500';

                                        if (netProfit > 0) {
                                            textColor = 'text-target/90';
                                            if (yieldPercentage > 5) bgColor = 'bg-target/20';
                                            else if (yieldPercentage > 2) bgColor = 'bg-target/10';
                                            else bgColor = 'bg-target/5';
                                        } else if (netProfit < 0) {
                                            textColor = 'text-stop/90';
                                            if (yieldPercentage < -5) bgColor = 'bg-stop/20';
                                            else if (yieldPercentage < -2) bgColor = 'bg-stop/10';
                                            else bgColor = 'bg-stop/5';
                                        }

                                        return (
                                            <td key={`${year}-${month}`} className={`px-4 py-3 border border-gunmetal-800 text-right ${bgColor}`}>
                                                {netProfit !== 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className={`font-mono font-bold ${textColor}`}>
                                                            {yieldPercentage > 0 ? '+' : ''}{yieldPercentage.toFixed(2)}%
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono">
                                                            {netProfit > 0 ? '+' : ''}${Math.abs(netProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                        );
                                    })}

                                    {/* YTD Cell */}
                                    <td className="px-4 py-3 border border-gunmetal-800 text-right bg-gunmetal-900/50">
                                        {(() => {
                                            const ytdYield = initialBalance > 0 ? (ytdTotal / initialBalance) * 100 : 0;
                                            return (
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-mono font-bold ${ytdYield > 0 ? 'text-target' : ytdYield < 0 ? 'text-stop' : 'text-gray-400'}`}>
                                                        {ytdYield > 0 ? '+' : ''}{ytdYield.toFixed(2)}%
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        ${ytdTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="text-[10px] text-gray-500 flex items-center justify-end gap-4 mt-2">
                <div className="flex gap-2 items-center"><div className="w-3 h-3 bg-target/20 rounded-sm"></div> &gt; 5% Gain</div>
                <div className="flex gap-2 items-center"><div className="w-3 h-3 bg-stop/20 rounded-sm"></div> &lt; -5% Loss</div>
            </div>
        </Card>
    );
};
