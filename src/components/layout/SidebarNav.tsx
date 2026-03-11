'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTree, Wallet } from 'lucide-react';

export const SidebarNav = () => {
    const pathname = usePathname();

    const links = [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/trades', icon: ListTree, label: 'Trades & Data' },
        { href: '/accounts', icon: Wallet, label: 'Accounts' },
    ];

    return (
        <nav className="flex md:flex-col items-center gap-4 bg-gunmetal-900 border border-gunmetal-700 p-2 sm:p-4 rounded-full md:h-full z-50 order-last md:order-first w-full md:w-auto overflow-x-auto justify-center md:justify-start">
            {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive
                            ? 'bg-target text-black shadow-[0_0_15px_rgba(0,200,5,0.4)]'
                            : 'text-gray-500 hover:text-white hover:bg-gunmetal-800'
                            }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />

                        {/* Tooltip for desktop */}
                        <div className="absolute left-16 px-3 py-1.5 bg-gunmetal-800 text-white text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] md:block hidden shadow-xl border border-gunmetal-700">
                            {link.label}
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
};
