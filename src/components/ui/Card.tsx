import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    glowColor?: 'emerald' | 'crimson' | 'amber' | 'none';
    noPadding?: boolean;
}

export const Card = ({ children, className, glowColor = 'none', noPadding = false }: CardProps) => {
    const glowClasses = {
        emerald: 'hover:shadow-[0_0_30px_rgba(0,200,5,0.15)] hover:border-target/50',
        crimson: 'hover:shadow-[0_0_30px_rgba(255,0,50,0.15)] hover:border-stop/50',
        amber: 'hover:shadow-[0_0_30px_rgba(255,191,0,0.15)] hover:border-breakeven/50',
        none: 'hover:border-gunmetal-700'
    };

    return (
        <div
            className={cn(
                "relative rounded-2xl bg-gunmetal-900/80 border border-glassBorder backdrop-blur-xl overflow-hidden",
                "transition-all duration-500 ease-out",
                glowClasses[glowColor],
                className
            )}
        >
            {/* Subtle interior gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Content wrapper */}
            <div className={cn("relative z-10 h-full", !noPadding && "p-6")}>
                {children}
            </div>
        </div>
    );
};
