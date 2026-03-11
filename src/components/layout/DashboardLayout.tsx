'use client';

import { ReactNode, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

import { SidebarNav } from './SidebarNav';
import { useTradeStore } from '@/store/useTradeStore';

interface DashboardLayoutProps {
    children: ReactNode;
    leftSidebar?: ReactNode;
    rightSidebar?: ReactNode;
    onQuickAdd?: () => void;
}

export const DashboardLayout = ({ children, leftSidebar, rightSidebar, onQuickAdd }: DashboardLayoutProps) => {
    const fetchTrades = useTradeStore(state => state.fetchTrades);

    useEffect(() => {
        // Fetch trades from Supabase on mount
        fetchTrades();
    }, [fetchTrades]);

    return (
        <div className="min-h-screen bg-black text-foreground font-sans overflow-hidden selection:bg-target/30 relative">
            {/* Background ambient glow */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-target/5 blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gunmetal-700/10 blur-[150px] pointer-events-none" />

            <main className="relative z-10 h-screen w-screen p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6">

                {/* Global Navigation Shell */}
                <div className="flex-shrink-0 flex md:flex-col h-auto md:h-full">
                    <SidebarNav />
                </div>

                {/* Left Sidebar - Timeline usually */}
                {leftSidebar && (
                    <motion.aside
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6"
                    >
                        {leftSidebar}
                    </motion.aside>
                )}

                {/* Main Content Area - Bento Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className="flex-1 flex flex-col gap-6 h-full overflow-hidden"
                >
                    {children}
                </motion.div>

                {/* Right Sidebar - Stats or Actions */}
                {rightSidebar && (
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                        className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6"
                    >
                        {rightSidebar}
                    </motion.aside>
                )}

            </main>

            {/* Floating Action Button for Quick Add */}
            <button
                onClick={onQuickAdd}
                className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-target flex items-center justify-center text-black hover:scale-110 hover:shadow-[0_0_30px_rgba(0,200,5,0.4)] transition-all duration-300 z-50 focus:outline-none"
                aria-label="Quick Add Trade"
            >
                <Plus className="w-6 h-6 stroke-[3]" />
            </button>
        </div>
    );
};
