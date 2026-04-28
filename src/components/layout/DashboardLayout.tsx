'use client';

import { ReactNode, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

import { SidebarNav } from './SidebarNav';
import { useTradeStore } from '@/store/useTradeStore';
import { LoginPage } from '@/components/auth/LoginPage';
import { supabase } from '@/lib/supabase';

interface DashboardLayoutProps {
    children: ReactNode;
    leftSidebar?: ReactNode;
    rightSidebar?: ReactNode;
    onQuickAdd?: () => void;
}

export const DashboardLayout = ({ children, leftSidebar, rightSidebar, onQuickAdd }: DashboardLayoutProps) => {
    const { user, setUser, fetchTrades } = useTradeStore();

    useEffect(() => {
        // Handle session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchTrades();
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchTrades();
            }
        });

        return () => subscription.unsubscribe();
    }, [setUser, fetchTrades]);

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden selection:bg-target/30 relative flex flex-col md:flex-row">
            {/* Global Navigation Shell */}
            <div className="flex-shrink-0 flex md:flex-col h-auto md:h-screen w-full md:w-20 border-r border-[#1a1a1c]">
                <SidebarNav />
            </div>

            <main className="relative z-10 flex-1 h-screen flex gap-6 overflow-hidden bg-[#0A0A0B] p-4 md:p-6 lg:px-8 lg:py-6">

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
