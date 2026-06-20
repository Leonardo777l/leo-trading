'use client';

import { useState } from 'react';
import { useTradeStore } from '@/store/useTradeStore';
import { DatabaseSwitcher } from '@/components/layout/DatabaseSwitcher';
import { Filter, Calendar, Settings, RefreshCw, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export const TradezellaHeader = () => {
    const { user, fetchTrades, isLoading } = useTradeStore();
    const [importTime, setImportTime] = useState<string>(() => {
        return format(new Date(), "MMM dd, yyyy hh:mm a");
    });

    const handleResync = async () => {
        await fetchTrades();
        setImportTime(format(new Date(), "MMM dd, yyyy hh:mm a"));
    };

    return (
        <div className="flex flex-col gap-2 w-full border-b border-gunmetal-700/30 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                {/* Left Side: Title */}
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Dashboard
                    </h1>
                </div>

                {/* Right Side: Header Tools */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Database selector */}
                    <DatabaseSwitcher variant="header" />

                    {/* Filter Button */}
                    <button className="flex items-center gap-2 bg-[#131316] border border-gunmetal-700 hover:border-gray-500 transition px-4 py-2 rounded-lg text-xs font-bold text-gray-300">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filters</span>
                    </button>

                    {/* Date Range Button */}
                    <button className="flex items-center gap-2 bg-[#131316] border border-gunmetal-700 hover:border-gray-500 transition px-4 py-2 rounded-lg text-xs font-bold text-gray-300">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Date range</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>

                    {/* My Account Dropdown */}
                    <div className="flex items-center gap-2 bg-[#131316] border border-gunmetal-700 hover:border-gray-500 transition px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 cursor-pointer">
                        {user?.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="User avatar"
                                className="w-5 h-5 rounded-full border border-gunmetal-700"
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gunmetal-800 flex items-center justify-center text-[10px] font-bold">
                                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                        )}
                        <span className="hidden sm:inline">My Account</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                    </div>

                    {/* Start my Day button */}
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg text-xs font-bold shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
                        <span>Start my day</span>
                    </button>

                    {/* Settings Gear */}
                    <button className="flex items-center justify-center bg-[#131316] border border-gunmetal-700 hover:border-gray-500 transition w-9 h-9 rounded-lg text-gray-400 hover:text-white">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Import Info Row */}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-semibold tracking-wide">
                <span>Last Import:</span>
                <span className="text-gray-400">{importTime}</span>
                <button
                    onClick={handleResync}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-400 transition font-bold cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Resync</span>
                </button>
            </div>
        </div>
    );
};
