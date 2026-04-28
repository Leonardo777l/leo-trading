import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PropFirmType = 'Topstep' | 'Lucid Flex' | 'My Funded Futures' | 'Custom';
export type DrawdownType = 'EOD' | 'Trailing' | 'Static';

export interface PropFirmAccount {
    id: string;
    name: string;
    type: PropFirmType;
    balance: number;
    drawdownLimit: number; // e.g. $2500
    drawdownType: DrawdownType;
    profitTarget: number; // e.g. $3000
    maxDrawdownCap?: number; // e.g. Balance + 100 for MFF. If undefined, no cap.
    isActive: boolean;
    createdAt: string;
}

interface PropFirmState {
    accounts: PropFirmAccount[];
    addAccount: (account: Omit<PropFirmAccount, 'id' | 'createdAt'>) => void;
    updateAccount: (id: string, updates: Partial<PropFirmAccount>) => void;
    deleteAccount: (id: string) => void;
    toggleAccountStatus: (id: string) => void;
}

export const usePropFirmStore = create<PropFirmState>()(
    persist(
        (set) => ({
            accounts: [],
            
            addAccount: (account) => set((state) => ({
                accounts: [
                    ...state.accounts,
                    {
                        ...account,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString()
                    }
                ]
            })),

            updateAccount: (id, updates) => set((state) => ({
                accounts: state.accounts.map(acc => 
                    acc.id === id ? { ...acc, ...updates } : acc
                )
            })),

            deleteAccount: (id) => set((state) => ({
                accounts: state.accounts.filter(acc => acc.id !== id)
            })),

            toggleAccountStatus: (id) => set((state) => ({
                accounts: state.accounts.map(acc => 
                    acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
                )
            }))
        }),
        {
            name: 'leo-prop-firm-storage', // Key in local storage
        }
    )
);
