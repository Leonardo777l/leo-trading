import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShotOutcome = 'target' | 'stop' | null;

export interface Shot {
    id: string;
    outcome: ShotOutcome;
    date: string; // ISO string
}

interface BitacoraState {
    shots: Shot[];
    addShot: (outcome: ShotOutcome) => void;
    updateShot: (id: string, outcome: ShotOutcome) => void;
    deleteShot: (id: string) => void;
    resetShots: () => void;
}

export const useBitacoraStore = create<BitacoraState>()(
    persist(
        (set) => ({
            shots: [],
            addShot: (outcome) => set((state) => ({
                shots: [
                    ...state.shots,
                    {
                        id: crypto.randomUUID(),
                        outcome,
                        date: new Date().toISOString(),
                    }
                ]
            })),
            updateShot: (id, outcome) => set((state) => ({
                shots: state.shots.map((shot) => 
                    shot.id === id ? { ...shot, outcome } : shot
                )
            })),
            deleteShot: (id) => set((state) => ({
                shots: state.shots.filter((shot) => shot.id !== id)
            })),
            resetShots: () => set({ shots: [] })
        }),
        {
            name: 'bitacora-storage',
        }
    )
);
