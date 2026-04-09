'use client';

import { useMemo, useState } from 'react';
import { useTradeStore } from '@/store/useTradeStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { PsychologyHeatmap } from '@/components/dashboard/PsychologyHeatmap';
import { MonthlyReturnMatrix } from '@/components/dashboard/MonthlyReturnMatrix';
import { WinLossDistributionChart } from '@/components/dashboard/WinLossDistributionChart';
import { TradingCalendar } from '@/components/dashboard/TradingCalendar';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';

export default function Home() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const trades = useTradeStore(state => state.trades);
  const selectedStrategy = useTradeStore(state => state.selectedStrategy);

  const activeStrategies = useMemo(() => {
    const strats = trades.map(t => t.strategy ? t.strategy.trim() : 'Order Flow');
    const unique = Array.from(new Set(strats));
    if (!unique.includes('Order Flow')) unique.push('Order Flow');
    return unique.sort();
  }, [trades]);

  return (
    <>
      <DashboardLayout
        onQuickAdd={() => setIsQuickAddOpen(true)}
      >
        <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                PRO JOURNAL
              </h1>
              <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                Vanguardista Edition
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gunmetal-900 border border-gunmetal-700 px-3 py-1.5 rounded-full">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">STRATEGY / VARIANT:</span>
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
              
              <div className="flex items-center gap-2 bg-gunmetal-900 border border-gunmetal-700 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-target animate-pulse shadow-[0_0_8px_#00C805]" />
                <span className="text-[10px] font-bold text-gray-300 tracking-wider">SYSTEM ONLINE</span>
              </div>
            </div>
          </header>

          <StatsOverview />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 min-h-[650px]">
              <TradingCalendar />
            </div>
            <div className="min-h-[400px]">
              <WinLossDistributionChart />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <MonthlyReturnMatrix />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-[400px]">
            <EquityCurve />
            <PsychologyHeatmap />
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
