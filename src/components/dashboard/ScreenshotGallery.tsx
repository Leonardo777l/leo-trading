'use client';

import { useActiveTrades } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

export const ScreenshotGallery = () => {
    const trades = useActiveTrades();

    // Filter trades that have an image link
    const tradesWithImages = trades.filter(t => t.imageLink && t.imageLink.trim() !== '');

    return (
        <Card className="h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight">Gallery</h3>
                <span className="text-xs text-gray-500">{tradesWithImages.length} Shots</span>
            </div>

            {tradesWithImages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[150px]">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No screenshots added.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar flex-1 pr-2 max-h-[400px]">
                    {tradesWithImages.map((trade) => {
                        const isWin = trade.netProfit > 0;
                        return (
                            <a
                                key={trade.id}
                                href={trade.imageLink}
                                target="_blank"
                                rel="noreferrer"
                                className="group block relative aspect-video rounded-lg overflow-hidden border border-gunmetal-700 hover:border-glassBorder hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all"
                            >
                                {/* Fallback abstract background - a film strip or glass pattern */}
                                <div className="absolute inset-0 bg-gunmetal-800 flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-500 to-transparent" />
                                    <ImageIcon className="w-6 h-6 text-gray-600 transition-colors z-10" />
                                </div>

                                {/* Overlay with details */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-2 z-20">
                                    <div className="flex justify-between w-full">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-black/50 px-1.5 py-0.5 rounded">
                                            {trade.direction}
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-white" />
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-mono font-bold text-gray-200">
                                            ${trade.netProfit > 0 ? '+' : ''}{trade.netProfit.toFixed(0)}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${isWin ? 'bg-target text-target' : trade.netProfit < 0 ? 'bg-stop text-stop' : 'bg-breakeven text-breakeven'}`} />
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};
