'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Target, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useRuleStore } from '@/store/useRuleStore';
import { useTradeStore } from '@/store/useTradeStore';

export default function RulesPage() {
    const { user } = useTradeStore();
    const { rules, fetchRules, addRule, removeRule, isLoading } = useRuleStore();

    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Checklist state: stores IDs of checked rules
    const [checkedRules, setCheckedRules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            fetchRules(user);
        }
    }, [user, fetchRules]);

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !user) return;
        setIsAdding(true);
        await addRule(user, newTitle, newDesc);
        setNewTitle('');
        setNewDesc('');
        setIsAdding(false);
    };

    const toggleCheck = (id: string) => {
        setCheckedRules(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleResetChecklist = () => {
        setCheckedRules(new Set());
    };

    // If still loading or not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-black w-full flex items-center justify-center p-6">
                <div className="text-center bg-gunmetal-900 border border-gunmetal-700 p-8 rounded-3xl max-w-md w-full shadow-2xl">
                    <ShieldAlert className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-white mb-2">Acceso Denegado</h2>
                    <p className="text-gray-400 font-medium">Inicia sesión interactuando en el dashboard para crear tus propias reglas de trading.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black w-full flex flex-col py-12 px-4 sm:px-6 lg:px-12 items-center">
            <div className="w-full max-w-7xl flex flex-col gap-10">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gunmetal-700/50 pb-6 w-full">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                            REGLAS Y CHECKLIST
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 tracking-widest mt-2 uppercase">
                            Disciplina, Estrategia y Gestión de Riesgo Personalizada
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    
                    {/* COLUMNA 1: MIS REGLAS (CRUD) */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-gunmetal-900 border border-gunmetal-700 p-6 md:p-8 rounded-[2rem] relative shadow-2xl flex flex-col h-full">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 shrink-0">
                                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                Mis Reglas de Trading
                            </h2>
                            
                            {/* ADD RULE FORM */}
                            <form onSubmit={handleAddRule} className="mb-8 flex flex-col gap-3 bg-gunmetal-800/40 p-5 rounded-2xl border border-gunmetal-700/30 shrink-0">
                                <h3 className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Añadir Nueva Regla</h3>
                                <input 
                                    type="text" 
                                    placeholder="Título (ej. A favor de tendencia)" 
                                    className="w-full bg-gunmetal-950/50 border border-gunmetal-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                                <textarea 
                                    placeholder="Descripción corta de tu parámetro (opcional)" 
                                    className="w-full bg-gunmetal-950/50 border border-gunmetal-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none h-20 text-sm font-medium"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isAdding || !newTitle.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:hover:bg-blue-600 mt-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    {isAdding ? 'Guardando...' : 'Guardar Regla'}
                                </button>
                            </form>

                            {/* RULES LIST */}
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                ) : rules.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-gunmetal-700 rounded-2xl flex flex-col items-center justify-center opacity-60">
                                        <ShieldAlert className="w-12 h-12 text-gray-500 mb-3" />
                                        <p className="text-gray-400 text-sm font-medium">Aún no tienes reglas.</p>
                                        <p className="text-gray-500 text-xs">Agrega una regla usando el formulario de arriba.</p>
                                    </div>
                                ) : (
                                    rules.map((rule) => (
                                        <div key={rule.id} className="group relative flex gap-4 items-start bg-gunmetal-800/80 p-5 rounded-2xl border border-gunmetal-700 hover:border-blue-500/30 transition-colors">
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-white mb-1">{rule.title}</h3>
                                                {rule.description && (
                                                    <p className="text-sm text-gray-400 leading-relaxed font-medium">{rule.description}</p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => removeRule(rule.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-stop hover:bg-stop/10 rounded-lg border border-transparent hover:border-stop/20 transition-all shrink-0"
                                                title="Eliminar regla"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 2: CHECKLIST DE PRE-ENTRADA */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-gunmetal-900 border border-gunmetal-700 p-6 md:p-8 rounded-[2rem] relative shadow-2xl overflow-hidden group flex flex-col h-full min-h-[500px]">
                            {/* Efecto de fondo sutil */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-target/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors duration-500" />
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-2 shrink-0">
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <span className="w-2 h-8 bg-target rounded-full"></span>
                                        Checklist de Entrada
                                    </h2>
                                    {checkedRules.size > 0 && (
                                        <button 
                                            onClick={handleResetChecklist}
                                            className="text-xs font-bold text-gray-400 hover:text-white bg-gunmetal-800 px-3 py-1.5 rounded-lg border border-gunmetal-700 transition-colors"
                                        >
                                            RESETEAR
                                        </button>
                                    )}
                                </div>
                                
                                <p className="text-sm text-gray-400 font-medium mb-8 shrink-0">
                                    Antes de apretar el gatillo, verifica que presentes todas tus confirmaciones al mercado.
                                </p>

                                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                    {rules.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-600">
                                            <Target className="w-16 h-16 mb-4 opacity-30" />
                                            <p className="text-sm font-medium opacity-80">Agrega reglas en el panel izquierdo</p>
                                            <p className="text-xs opacity-60">para construir tu checklist de entrada.</p>
                                        </div>
                                    ) : (
                                        rules.map((rule) => {
                                            const isChecked = checkedRules.has(rule.id);
                                            return (
                                                <button 
                                                    key={rule.id}
                                                    onClick={() => toggleCheck(rule.id)}
                                                    className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 group/check ${
                                                        isChecked 
                                                        ? 'bg-target/10 border-target/50 shadow-[0_0_15px_rgba(var(--color-target-rgb),0.1)]' 
                                                        : 'bg-gunmetal-950/50 border-gunmetal-700/50 hover:bg-gunmetal-800/80 hover:border-gunmetal-600'
                                                    }`}
                                                >
                                                    <div className="mt-0.5 shrink-0 transition-transform group-hover/check:scale-110">
                                                        {isChecked ? (
                                                            <CheckCircle2 className="w-6 h-6 text-target shadow-[0_0_10px_rgba(var(--color-target-rgb),0.5)] rounded-full" />
                                                        ) : (
                                                            <Circle className="w-6 h-6 text-gray-600 group-hover/check:text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className={`flex-1 transition-all duration-300 ${isChecked ? 'opacity-70' : 'opacity-100'}`}>
                                                        <h3 className={`text-sm font-bold transition-colors ${isChecked ? 'text-target line-through' : 'text-white'}`}>
                                                            {rule.title}
                                                        </h3>
                                                        {rule.description && (
                                                            <p className={`text-xs mt-1 transition-colors leading-relaxed ${isChecked ? 'text-target/70 line-through' : 'text-gray-400'}`}>
                                                                {rule.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                                
                                {/* Progress Bar / Summary */}
                                {rules.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gunmetal-700/50 shrink-0">
                                        <div className="flex justify-between items-center text-xs font-bold mb-3">
                                            <span className="text-gray-400 uppercase tracking-widest">Nivel de Confirmación</span>
                                            <span className={`px-2 py-0.5 rounded-md ${checkedRules.size === rules.length ? 'bg-target text-black' : 'bg-gunmetal-800 text-gray-300'}`}>
                                                {checkedRules.size} / {rules.length}
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-gunmetal-950 rounded-full overflow-hidden border border-gunmetal-700/50">
                                            <div 
                                                className={`h-full transition-all duration-700 ease-out relative ${checkedRules.size === rules.length ? 'bg-target' : 'bg-blue-500'}`}
                                                style={{ width: `${(checkedRules.size / Math.max(1, rules.length)) * 100}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                                            </div>
                                        </div>
                                        {checkedRules.size === rules.length && rules.length > 0 && (
                                            <div className="mt-6 flex flex-col items-center justify-center p-4 bg-target/10 border border-target/30 rounded-xl">
                                                <p className="text-target text-sm font-black text-center uppercase tracking-widest flex items-center justify-center gap-2">
                                                    <Target className="w-5 h-5 animate-pulse" />
                                                    Parámetros Cumplidos
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1 font-medium text-center">
                                                    Todo se alinea. Ejecuta tu trade con disciplina.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
