'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DatabaseSwitcher } from '@/components/layout/DatabaseSwitcher';
import { TradesTable } from '@/components/dashboard/TradesTable';
import { TimelineFeed } from '@/components/dashboard/TimelineFeed';
import { CsvUploader } from '@/components/import/CsvUploader';
import { QuickAddTrade } from '@/components/forms/QuickAddTrade';
import { useTradeStore } from '@/store/useTradeStore';
import { RefreshCw } from 'lucide-react';

export default function TradesPage() {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const { masterRestoration, isLoading } = useTradeStore();

    const handleRestore = async () => {
        if(!confirm('¿Estás seguro de RE-IMPORTAR toda la data original? Esto borrará tus trades actuales de backtesting para poner los del Excel corregidos (sin fines de semana y con montos reales).')) return;
        try {
            const res = await fetch('/restored_backtesting.json');
            const data = await res.json();
            await masterRestoration(data);
            alert('¡Data restaurada con éxito!');
        } catch (e) {
            console.error(e);
            alert('Error al restaurar la data. Asegúrate de que el archivo JSON esté generado.');
        }
    };


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
                                <button
                                    onClick={handleRestore}
                                    disabled={isLoading}
                                    className="bg-gunmetal-800 hover:bg-gunmetal-700 text-gray-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold border border-gunmetal-700 transition-all flex items-center gap-2"
                                    title="Restaurar data original desde CSV"
                                >
                                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                    RESTAURAR ORIGINALES
                                </button>
                                <DatabaseSwitcher variant="header" />
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
