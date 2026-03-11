'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TradesTable } from '@/components/dashboard/TradesTable';
import { TimelineFeed } from '@/components/dashboard/TimelineFeed';
import { CsvUploader } from '@/components/import/CsvUploader';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';

export default function TradesPage() {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

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
