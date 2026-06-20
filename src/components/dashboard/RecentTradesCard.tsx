'use client';

import { useState, useMemo } from 'react';
import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { format } from 'date-fns';

export const RecentTradesCard = () => {
    const trades = useActiveTrades();
    const [activeTab, setActiveTab] = useState<'recent' | 'open'>('recent');

    // Get 6 most recent trades
    const recentTradesList = useMemo(() => {
        const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.slice(0, 6);
    }, [trades]);

    return (
        <Card className="flex flex-col bg-[#131316] border-gunmetal-700 min-h-[380px] p-5 justify-between">
            <div className="flex flex-col gap-4 w-full h-full flex-1">
                {/* Tabs Selector */}
                <div className="flex gap-4 border-b border-gunmetal-700/50 pb-2">
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`text-xs font-black uppercase tracking-widest pb-1 transition-all ${
                            activeTab === 'recent'
                                ? 'text-white border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Recent trades
                    </button>
                    <button
                        onClick={() => setActiveTab('open')}
                        className={`text-xs font-black uppercase tracking-widest pb-1 transition-all ${
                            activeTab === 'open'
                                ? 'text-white border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Open positions
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 w-full overflow-hidden flex flex-col justify-start">
                    {activeTab === 'recent' ? (
                        <div className="flex flex-col w-full h-full">
                            {recentTradesList.length > 0 ? (
                                <div className="flex flex-col w-full divide-y divide-gunmetal-800/65">
                                    {recentTradesList.map((trade) => {
                                        let dateDisplay = '--';
                                        try {
                                            dateDisplay = format(new Date(trade.date), 'MM/dd/yyyy');
                                        } catch {}

                                        const isWin = trade.netProfit >= 0;

                                        return (
                                            <div
                                                key={trade.id}
                                                className="flex items-center justify-between py-3 text-xs font-bold text-gray-300 hover:bg-gunmetal-800/10 px-1 transition"
                                            >
                                                <span className="text-gray-500 font-semibold">{dateDisplay}</span>
                                                <span className="text-white uppercase font-black">{trade.instrument || 'MNQ'}</span>
                                                <span className={isWin ? 'text-[#00D632]' : 'text-[#FF334B]'}>
                                                    {isWin ? '+' : '-'}${Math.abs(trade.netProfit).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center flex-1 py-12 text-xs font-bold text-gray-600">
                                    No recent trades logged
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center flex-1 py-12 text-xs font-black text-gray-600 uppercase tracking-widest">
                            No open positions
                        </div>
                    )}
                </div>
            </div>

            {/* View More link */}
            {activeTab === 'recent' && recentTradesList.length > 0 && (
                <div className="text-center pt-3 border-t border-gunmetal-700/30">
                    <Link
                        href="/trades"
                        className="text-[10px] font-black text-purple-500 hover:text-purple-400 uppercase tracking-widest transition"
                    >
                        View More
                    </Link>
                </div>
            )}
        </Card>
    );
};
