import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTree, Wallet, LogOut, BookOpenText, Calculator } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';

export const SidebarNav = () => {
    const pathname = usePathname();
    const { user, signOut } = useTradeStore();

    const links = [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/trades', icon: ListTree, label: 'Trades & Data' },
        { href: '/accounts', icon: Wallet, label: 'Accounts' },
        { href: '/rules', icon: BookOpenText, label: 'Reglas' },
        { href: '/risk', icon: Calculator, label: 'Riesgo' },
    ];

    return (
        <nav className="flex md:flex-col items-center gap-4 bg-[#111113] border-r border-gunmetal-700 p-2 sm:p-4 rounded-full md:rounded-none md:h-full z-50 order-last md:order-first w-full md:w-auto overflow-x-auto justify-center md:justify-start shadow-xl">
            <div className="hidden md:flex mb-6 mt-2 w-10 h-10 bg-gradient-to-br from-gunmetal-700 to-gunmetal-900 rounded-xl items-center justify-center border border-gunmetal-700 shadow-sm">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">LT</span>
            </div>
            {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ${isActive
                            ? 'bg-gunmetal-800 text-target shadow-[inset_0_1px_4px_rgba(0,214,50,0.1)] border border-gunmetal-700'
                            : 'text-gray-500 hover:text-white hover:bg-gunmetal-800'
                            }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />

                        <div className="absolute left-14 px-3 py-1.5 bg-gunmetal-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] md:block hidden shadow-xl border border-gunmetal-700">
                            {link.label}
                        </div>
                    </Link>
                );
            })}


            <div className="md:mt-auto flex md:flex-col items-center gap-4">
                {user?.user_metadata?.avatar_url ? (
                    <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-xl border border-gunmetal-700 shadow-sm" 
                    />
                ) : (
                   <div className="w-10 h-10 rounded-xl border border-gunmetal-700 bg-gunmetal-800 flex items-center justify-center text-xs font-bold shadow-sm">U</div>
                )}
                
                <button
                    onClick={() => {
                        if (window.confirm('¿Quieres cerrar sesión?')) {
                            signOut();
                        }
                    }}
                    className="group relative flex items-center justify-center w-11 h-11 rounded-xl text-gray-500 hover:text-stop hover:bg-stop/10 transition-all duration-300"
                    aria-label="Cerrar sesión"
                >
                    <LogOut className="w-5 h-5" />
                    <div className="absolute left-14 px-3 py-1.5 bg-gunmetal-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] md:block hidden shadow-xl border border-gunmetal-700">
                        Cerrar Sesión
                    </div>
                </button>
            </div>
        </nav>
    );
};
