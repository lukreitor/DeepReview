import { create } from 'zustand';
const storeCreator = (set) => ({
    jobs: [],
    upsert: (job) => set((state) => {
        const existing = state.jobs.find((item) => item.id === job.id);
        if (existing) {
            return {
                jobs: state.jobs.map((item) => item.id === job.id ? { ...existing, ...job } : item),
            };
        }
        return { jobs: [...state.jobs, job] };
    }),
    remove: (id) => set((state) => ({
        jobs: state.jobs.filter((item) => item.id !== id),
    })),
    clear: () => set({ jobs: [] }),
});
export const useReviewStore = create(storeCreator);
