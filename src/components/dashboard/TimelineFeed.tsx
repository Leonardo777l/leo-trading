'use client';

import { useTradeStore, Trade } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Activity } from 'lucide-react';

const MoodBadge = ({ mood }: { mood: Trade['estadoMental'] }) => {
    const styles = {
        Calm: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        Anxiety: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
        FOMO: 'bg-purple-500/20 text-purple-400 border-purple-500/50'
    };

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${styles[mood]}`}>
            {mood}
        </span>
    );
};

export const TimelineFeed = () => {
    const trades = useTradeStore(state => state.trades);

    // Sort by date descending
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedTrades.length === 0) {
        return (
            <Card className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p>No trades logged yet.</p>
                <p className="text-sm mt-2">Use the + button to add your first trade or import CSV.</p>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col overflow-hidden" noPadding>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-glassBorder">
                <h3 className="text-lg font-bold text-white tracking-tight">Timeline</h3>
                <span className="text-xs font-semibold text-gray-500">{trades.length} TRADES</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {sortedTrades.map(trade => {
                    const isWin = trade.netProfit > 0;
                    return (
                        <div
                            key={trade.id}
                            className="group relative flex items-center gap-4 p-4 rounded-xl bg-gunmetal-900 border border-transparent hover:border-glassBorder hover:bg-gunmetal-800 transition-all duration-300"
                        >
                            <div className={`w-1 h-[60%] absolute left-0 rounded-r-md ${isWin ? 'bg-target' : trade.netProfit < 0 ? 'bg-stop' : 'bg-breakeven'}`} />

                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-gunmetal-800 border border-gunmetal-700 ml-2">
                                {trade.direction === 'Long' ? (
                                    <ArrowUpRight className="w-5 h-5 text-target" />
                                ) : (
                                    <ArrowDownRight className="w-5 h-5 text-stop" />
                                )}
                            </div>

                            <div className="flex-1 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-white">
                                        {trade.direction} {trade.contracts} {trade.contracts > 1 ? 'Contracts' : 'Contract'}
                                        {trade.instrument && <span className="ml-2 text-xs text-gray-400 bg-gunmetal-800 px-1.5 py-0.5 rounded border border-gunmetal-700">{trade.instrument}</span>}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(trade.date), 'MMM dd, HH:mm')}
                                    </span>
                                </div>

                                {trade.notes && (
                                    <p className="text-xs text-gray-400 italic font-mono bg-gunmetal-800/50 p-1.5 rounded-md border border-gunmetal-700/50 mt-0.5 max-w-[90%] truncate">
                                        &quot;{trade.notes}&quot;
                                    </p>
                                )}

                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-xs text-gray-400 font-mono">
                                        Tar:{trade.ticksTarget} | SL:{trade.stopTicks}
                                    </span>
                                    <MoodBadge mood={trade.estadoMental} />
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-center min-w-[80px] pr-2">
                                <span className={`text-lg font-bold ${isWin ? 'text-target' : trade.netProfit < 0 ? 'text-stop' : 'text-breakeven'}`}>
                                    {trade.netProfit > 0 ? '+' : ''}{trade.netProfit.toFixed(2)}
                                </span>
                                {trade.imageLink && (
                                    <a
                                        href={trade.imageLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-gray-500 hover:text-white transition-colors mt-1"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
