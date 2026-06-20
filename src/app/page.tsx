'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TradezellaHeader } from '@/components/dashboard/TradezellaHeader';
import { TradezellaStats } from '@/components/dashboard/TradezellaStats';
import { ZellaScoreCard } from '@/components/dashboard/ZellaScoreCard';
import { ProgressTrackerCard } from '@/components/dashboard/ProgressTrackerCard';
import { DailyCumulativePnLCard } from '@/components/dashboard/DailyCumulativePnLCard';
import { NetDailyPnLCard } from '@/components/dashboard/NetDailyPnLCard';
import { RecentTradesCard } from '@/components/dashboard/RecentTradesCard';
import { AccountBalanceCard } from '@/components/dashboard/AccountBalanceCard';
import { TradezellaCalendarSection } from '@/components/dashboard/TradezellaCalendarSection';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';

export default function Home() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  return (
    <>
      <DashboardLayout
        onQuickAdd={() => setIsQuickAddOpen(true)}
      >
        <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
          
          {/* Header */}
          <TradezellaHeader />

          {/* Metric Stats Cards */}
          <TradezellaStats />

          {/* Row 2: Zella Score, Progress Tracker, Cumulative PnL */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ZellaScoreCard />
            <ProgressTrackerCard />
            <DailyCumulativePnLCard />
          </div>

          {/* Row 3: Daily Return Bar, Recent Trades, Account Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NetDailyPnLCard />
            <RecentTradesCard />
            <AccountBalanceCard />
          </div>

          {/* Row 4: Calendar Section with Stats, Drawdown, Scatter Time */}
          <TradezellaCalendarSection />

        </div>
      </DashboardLayout>

      <QuickAddTrade
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </>
  );
}
