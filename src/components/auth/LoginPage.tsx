'use client';

import { useTradeStore } from '@/store/useTradeStore';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';

export const LoginPage = () => {
    const signInWithGoogle = useTradeStore(state => state.signInWithGoogle);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-target/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <Card className="p-8 text-center border-gunmetal-700/50 backdrop-blur-md bg-black/40" glowColor="emerald">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-target/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-target/30 shadow-[0_0_20px_rgba(0,255,100,0.1)]">
                            <span className="text-2xl font-black text-target italic">L</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2 italic uppercase">
                            LEO <span className="text-target">TRADING</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-medium tracking-wide">
                            The Ultimate Prop-Trader Journal & Analytics
                        </p>
                    </div>

                    <div className="space-y-6">
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Sign in with your Google account to access your trades and personalized dashboard from any device.
                        </p>

                        <button
                            onClick={signInWithGoogle}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        >
                            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                            Continue with Google
                        </button>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gunmetal-800">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            Powered by Supabase & Vercel
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
