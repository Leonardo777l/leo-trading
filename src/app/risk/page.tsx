'use client';

import { RiskCalculator } from '@/components/risk/RiskCalculator';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function RiskPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-24 pr-2">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase">
                            Gestión de Riesgo
                        </h1>
                        <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                            Módulo de Recuperación Variable 1:1.5
                        </p>
                    </div>
                </header>

                <RiskCalculator />
            </div>
        </DashboardLayout>
    );
}
