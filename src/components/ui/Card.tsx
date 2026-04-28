import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    glowColor?: 'emerald' | 'crimson' | 'amber' | 'none';
    noPadding?: boolean;
}

export const Card = ({ children, className, glowColor = 'none', noPadding = false }: CardProps) => {
    const borderTopClasses = {
        emerald: 'border-t-target/80 shadow-[0_-1px_15px_rgba(0,214,50,0.1)]',
        crimson: 'border-t-stop/80 shadow-[0_-1px_15px_rgba(255,51,75,0.1)]',
        amber: 'border-t-breakeven/80',
        none: 'border-t-gunmetal-700'
    };

    return (
        <div
            className={cn(
                "relative rounded-xl bg-gunmetal-900 border border-gunmetal-700 overflow-hidden",
                "transition-all duration-300",
                glowColor !== 'none' && "border-t-[3px]",
                glowColor === 'none' && borderTopClasses.none,
                glowColor !== 'none' && borderTopClasses[glowColor],
                className
            )}
        >
            <div className={cn("relative z-10 w-full h-full", !noPadding && "p-5")}>
                {children}
            </div>
        </div>
    );
};
