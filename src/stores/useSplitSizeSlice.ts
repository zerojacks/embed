import { create } from 'zustand';

interface SplitSizeState {
    splitSize: number[];
    setSplitSize: (size: number[]) => void;
}

export const useSplitSizeStore = create<SplitSizeState>((set) => ({
    splitSize: [30, 70],
    setSplitSize: (size: number[]) => set({ splitSize: size }),
}));
