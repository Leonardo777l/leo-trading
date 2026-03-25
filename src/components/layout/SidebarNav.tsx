import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTree, Wallet, LogOut, BookOpenText } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';

export const SidebarNav = () => {
    const pathname = usePathname();
    const { user, signOut } = useTradeStore();

    const links = [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/trades', icon: ListTree, label: 'Trades & Data' },
        { href: '/accounts', icon: Wallet, label: 'Accounts' },
        { href: '/rules', icon: BookOpenText, label: 'Reglas' },
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
                        target={link.href === '/rules' ? '_blank' : undefined}
                        rel={link.href === '/rules' ? 'noopener noreferrer' : undefined}
                        className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive && link.href !== '/rules'
                            ? 'bg-target text-black shadow-[0_0_15px_rgba(0,200,5,0.4)]'
                            : 'text-gray-500 hover:text-white hover:bg-gunmetal-800'
                            }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive && link.href !== '/rules' ? 'stroke-[2.5]' : ''}`} />

                        <div className="absolute left-16 px-3 py-1.5 bg-gunmetal-800 text-white text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] md:block hidden shadow-xl border border-gunmetal-700">
                            {link.label}
                        </div>
                    </Link>
                );
            })}

            <div className="md:mt-auto flex md:flex-col items-center gap-4">
                {user?.user_metadata?.avatar_url && (
                    <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full border border-gunmetal-700" 
                    />
                )}
                
                <button
                    onClick={() => {
                        if (window.confirm('¿Quieres cerrar sesión?')) {
                            signOut();
                        }
                    }}
                    className="group relative flex items-center justify-center w-12 h-12 rounded-full text-gray-500 hover:text-stop hover:bg-stop/10 transition-all duration-300"
                    aria-label="Cerrar sesión"
                >
                    <LogOut className="w-5 h-5" />
                    <div className="absolute left-16 px-3 py-1.5 bg-gunmetal-800 text-white text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] md:block hidden shadow-xl border border-gunmetal-700">
                        Cerrar Sesión
                    </div>
                </button>
            </div>
        </nav>
    );
};
