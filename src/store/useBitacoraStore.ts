import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShotOutcome = 'target' | 'stop' | null;

export interface Shot {
    id: string;
    outcome: ShotOutcome;
    date: string; // ISO string
}

export type AccountStatus = 'active' | 'passed' | 'failed';

export interface FundedAccount {
    id: string;
    name: string;
    size: number;
    status: AccountStatus;
    shots: Shot[];
    createdAt: string;
}

interface BitacoraState {
    accounts: FundedAccount[];
    activeAccountId: string | null;
    
    // Account Actions
    addAccount: (name: string, size: number) => void;
    setActiveAccount: (id: string | null) => void;
    updateAccountStatus: (id: string, status: AccountStatus) => void;
    deleteAccount: (id: string) => void;
    
    // Shot Actions (applies to activeAccountId)
    addShotToActive: (outcome: ShotOutcome) => void;
    updateShotInActive: (shotId: string, outcome: ShotOutcome) => void;
    deleteShotFromActive: (shotId: string) => void;
    resetShotsInActive: () => void;
}

export const useBitacoraStore = create<BitacoraState>()(
    persist(
        (set, get) => ({
            accounts: [],
            activeAccountId: null,

            addAccount: (name, size) => set((state) => {
                const newAccount: FundedAccount = {
                    id: crypto.randomUUID(),
                    name,
                    size,
                    status: 'active',
                    shots: [],
                    createdAt: new Date().toISOString()
                };
                return {
                    accounts: [newAccount, ...state.accounts],
                    activeAccountId: newAccount.id
                };
            }),
            
            setActiveAccount: (id) => set({ activeAccountId: id }),
            
            updateAccountStatus: (id, status) => set((state) => ({
                accounts: state.accounts.map(acc => 
                    acc.id === id ? { ...acc, status } : acc
                )
            })),
            
            deleteAccount: (id) => set((state) => ({
                accounts: state.accounts.filter(acc => acc.id !== id),
                activeAccountId: state.activeAccountId === id ? null : state.activeAccountId
            })),

            addShotToActive: (outcome) => set((state) => {
                if (!state.activeAccountId) return state;
                return {
                    accounts: state.accounts.map(acc => {
                        if (acc.id === state.activeAccountId) {
                            return {
                                ...acc,
                                shots: [...acc.shots, { id: crypto.randomUUID(), outcome, date: new Date().toISOString() }]
                            };
                        }
                        return acc;
                    })
                };
            }),

            updateShotInActive: (shotId, outcome) => set((state) => {
                if (!state.activeAccountId) return state;
                return {
                    accounts: state.accounts.map(acc => {
                        if (acc.id === state.activeAccountId) {
                            return {
                                ...acc,
                                shots: acc.shots.map(shot => shot.id === shotId ? { ...shot, outcome } : shot)
                            };
                        }
                        return acc;
                    })
                };
            }),

            deleteShotFromActive: (shotId) => set((state) => {
                if (!state.activeAccountId) return state;
                return {
                    accounts: state.accounts.map(acc => {
                        if (acc.id === state.activeAccountId) {
                            return {
                                ...acc,
                                shots: acc.shots.filter(shot => shot.id !== shotId)
                            };
                        }
                        return acc;
                    })
                };
            }),

            resetShotsInActive: () => set((state) => {
                if (!state.activeAccountId) return state;
                return {
                    accounts: state.accounts.map(acc => {
                        if (acc.id === state.activeAccountId) {
                            return { ...acc, shots: [] };
                        }
                        return acc;
                    })
                };
            })
        }),
        {
            name: 'funded-accounts-storage',
            version: 1,
            migrate: (persistedState: any, version) => {
                if (version === 0) {
                    // Try to migrate legacy shots into a default account if they exist
                    if (persistedState.shots && persistedState.shots.length > 0) {
                        return {
                            accounts: [{
                                id: crypto.randomUUID(),
                                name: "Legacy Account",
                                size: 50000,
                                status: "active",
                                shots: persistedState.shots,
                                createdAt: new Date().toISOString()
                            }],
                            activeAccountId: persistedState.shots.length > 0 ? persistedState.accounts?.[0]?.id || null : null
                        };
                    }
                }
                return persistedState;
            }
        }
    )
);
