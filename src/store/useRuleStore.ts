import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface TradingRule {
    id: string;
    user_id: string;
    title: string;
    description: string;
    created_at: string;
}

interface RuleState {
    rules: TradingRule[];
    isLoading: boolean;
    fetchRules: (user: User | null) => Promise<void>;
    addRule: (user: User | null, title: string, description: string) => Promise<void>;
    removeRule: (id: string) => Promise<void>;
}

export const useRuleStore = create<RuleState>((set) => ({
    rules: [],
    isLoading: false,

    fetchRules: async (user) => {
        if (!user) {
            set({ rules: [] });
            return;
        }

        set({ isLoading: true });
        const { data, error } = await supabase
            .from('trading_rules')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
            
        if (!error && data) {
            set({ rules: data as TradingRule[] });
        } else {
            console.error('Failed to fetch rules:', error);
            // Don't throw to avoid breaking UI if table doesn't exist yet
        }
        set({ isLoading: false });
    },

    addRule: async (user, title, description) => {
        if (!user) return;

        const newRule = {
            user_id: user.id,
            title,
            description
        };

        const { data, error } = await supabase
            .from('trading_rules')
            .insert([newRule])
            .select()
            .single();

        if (!error && data) {
            set((state) => ({ rules: [...state.rules, data as TradingRule] }));
        } else {
            console.error('Failed to add rule:', error);
        }
    },

    removeRule: async (id) => {
        const { error } = await supabase
            .from('trading_rules')
            .delete()
            .eq('id', id);

        if (!error) {
            set((state) => ({ rules: state.rules.filter(r => r.id !== id) }));
        } else {
            console.error('Failed to remove rule:', error);
        }
    }
}));
