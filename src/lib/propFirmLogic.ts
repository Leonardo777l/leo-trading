import { Trade } from '@/store/useTradeStore';
import { PropFirmAccount } from '@/store/usePropFirmStore';
import { format, startOfDay } from 'date-fns';

export interface PropFirmComputedStats {
    currentBalance: number;
    highestWatermark: number;
    currentDrawdownFloor: number;
    distanceToDrawdown: number;
    isFailed: boolean;
    isPassed: boolean;
    totalProfit: number;
    daysTraded: number;
    chartData: { date: string; balance: number; drawdownFloor: number }[];
}

export function computePropFirmStats(account: PropFirmAccount, trades: Trade[]): PropFirmComputedStats {
    // 1. Sort trades chronologically
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = account.balance;
    let highestWatermark = account.balance;
    let currentDrawdownFloor = account.balance - account.drawdownLimit;
    let isFailed = false;

    // Track unique days traded
    const daysTradedSet = new Set<string>();
    
    // For charting
    const chartData: { date: string; balance: number; drawdownFloor: number }[] = [
        { date: 'Start', balance: account.balance, drawdownFloor: currentDrawdownFloor }
    ];

    // EOD tracking map: day string -> total profit for that day
    const dailyProfits = new Map<string, number>();

    for (const trade of sortedTrades) {
        const dateObj = new Date(trade.date);
        if (isNaN(dateObj.getTime())) continue;

        const dayKey = format(startOfDay(dateObj), 'yyyy-MM-dd');
        daysTradedSet.add(dayKey);

        const profit = dailyProfits.get(dayKey) || 0;
        dailyProfits.set(dayKey, profit + trade.netProfit);
    }

    // Now simulate day by day for EOD logic
    const sortedDays = Array.from(dailyProfits.keys()).sort();

    for (const day of sortedDays) {
        const netDailyProfit = dailyProfits.get(day) || 0;
        currentBalance += netDailyProfit;

        // Static Drawdown: Floor never moves. (Lucid Flex)
        // Trailing Drawdown: Floor moves up in real-time (approximated here per trade if we need, but usually EOD)
        // EOD Drawdown: Floor moves up based on EOD balance (Topstep, MFF)

        if (account.drawdownType === 'EOD' || account.drawdownType === 'Trailing') {
            if (currentBalance > highestWatermark) {
                highestWatermark = currentBalance;
                
                // MFF has a rule where trailing stops at a certain cap (e.g. Starting Balance + $100)
                const newPotentialFloor = highestWatermark - account.drawdownLimit;
                
                if (account.maxDrawdownCap !== undefined) {
                    currentDrawdownFloor = Math.min(newPotentialFloor, account.maxDrawdownCap);
                } else {
                    currentDrawdownFloor = newPotentialFloor;
                }
            }
        }

        // Check failure
        if (currentBalance <= currentDrawdownFloor) {
            isFailed = true;
        }

        chartData.push({
            date: format(new Date(day), 'MMM dd'),
            balance: currentBalance,
            drawdownFloor: currentDrawdownFloor
        });
    }

    const totalProfit = currentBalance - account.balance;
    const isPassed = !isFailed && totalProfit >= account.profitTarget;

    return {
        currentBalance,
        highestWatermark,
        currentDrawdownFloor,
        distanceToDrawdown: currentBalance - currentDrawdownFloor,
        isFailed,
        isPassed,
        totalProfit,
        daysTraded: daysTradedSet.size,
        chartData
    };
}
