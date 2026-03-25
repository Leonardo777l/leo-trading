'use client';

import { ShieldAlert, Target, TrendingUp, Crosshair } from 'lucide-react';

export default function RulesPage() {
    const liquidezRules = [
        {
            icon: Target,
            title: "Puntos de Entrada",
            desc: "Entrar solo en order blocks identificados."
        },
        {
            icon: Crosshair,
            title: "Gestión de Contratos",
            desc: "Entrar a un contrato y buscar re-entradas por arriba y por abajo."
        },
        {
            icon: TrendingUp,
            title: "Análisis de Tendencia",
            desc: "Trazar tendencias en temporalidades de 1H, 15M y 5M. Buscar siempre la tendencia predominante."
        },
        {
            icon: ShieldAlert,
            title: "Gestión de Riesgo",
            desc: "Límite estricto: Solo 2 pérdidas o $250 dólares negativos por sesión."
        }
    ];

    return (
        <div className="min-h-screen bg-black w-full flex flex-col py-12 px-6 sm:px-12 items-center">
            <div className="w-full max-w-5xl flex flex-col gap-10">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gunmetal-700/50 pb-6 w-full">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                            REGLAS DE TRADING
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 tracking-widest mt-2 uppercase">
                            Disciplina, Estrategia y Gestión de Riesgo
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    {/* Estrategia Liquidez */}
                    <div className="bg-gunmetal-900 border border-gunmetal-700 p-8 rounded-[2rem] relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-target/10 rounded-full blur-3xl -mr-32 -mt-32 transition-colors duration-500 group-hover:bg-target/20" />
                        
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                                <span className="w-2 h-10 bg-target rounded-full"></span>
                                Estrategia Liquidez
                            </h2>
                            
                            <div className="space-y-6">
                                {liquidezRules.map((rule, idx) => {
                                    const Icon = rule.icon;
                                    return (
                                        <div key={idx} className="flex gap-5 items-start bg-gunmetal-800/80 p-5 rounded-2xl border border-gunmetal-700 shadow-lg hover:border-target/30 transition-colors">
                                            <div className="w-12 h-12 rounded-xl bg-black border border-gunmetal-700/50 flex items-center justify-center shrink-0">
                                                <Icon className={`w-6 h-6 ${rule.title === 'Gestión de Riesgo' ? 'text-stop' : 'text-target'}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white mb-1.5">{rule.title}</h3>
                                                <p className="text-sm text-gray-400 leading-relaxed font-medium">{rule.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                    {/* Placeholder for future strategies */}
                    <div className="bg-gunmetal-900/30 border border-gunmetal-700/30 border-dashed p-8 rounded-[2rem] flex items-center justify-center flex-col gap-4 group">
                        <div className="w-16 h-16 rounded-full bg-gunmetal-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-3xl font-light text-gray-500">+</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-500">Próxima Estrategia</h3>
                        <p className="text-sm text-gray-600 font-medium max-w-[200px] text-center">Espacio reservado para más estrategias o reglas generales.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
