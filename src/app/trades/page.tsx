'use client';

import { useState, useMemo } from 'react';
import { useTradeStore } from '@/store/useTradeStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TradesTable } from '@/components/dashboard/TradesTable';
import { TimelineFeed } from '@/components/dashboard/TimelineFeed';
import { CsvUploader } from '@/components/import/CsvUploader';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';

export default function TradesPage() {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const trades = useTradeStore(state => state.trades);
    const selectedStrategy = useTradeStore(state => state.selectedStrategy);

    const activeStrategies = useMemo(() => {
        const strats = trades.map(t => t.strategy ? t.strategy.trim() : 'Order Flow');
        const unique = Array.from(new Set(strats));
        if (!unique.includes('Order Flow')) unique.push('Order Flow');
        if (!unique.includes('Liquidez')) unique.push('Liquidez');
        return unique.sort();
    }, [trades]);

    return (
        <>
            <DashboardLayout
                onQuickAdd={() => setIsQuickAddOpen(true)}
            >
                <div className="flex flex-col xl:flex-row gap-6 h-full overflow-hidden">

                    <div className="w-full xl:w-1/4 h-full flex-shrink-0">
                        <TimelineFeed />
                    </div>

                    <div className="w-full xl:w-3/4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
                        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                    DATABASE
                                </h1>
                                <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                                    Data & Trade History Management
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-gunmetal-900 border border-gunmetal-700 px-3 py-1.5 rounded-full">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">STRATEGY:</span>
                                    <select
                                        value={selectedStrategy}
                                        onChange={(e) => useTradeStore.getState().setSelectedStrategy(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold text-target focus:outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="ALL">ALL STRATEGIES</option>
                                        {activeStrategies.map(strat => (
                                            <option key={strat} value={strat}>{strat.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </header>

                        <CsvUploader />
                        <TradesTable />
                    </div>

                </div>
            </DashboardLayout>

            <QuickAddTrade
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
            />
        </>
    );
}
