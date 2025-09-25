import { create, StateCreator } from 'zustand';

export type ReviewJob = {
  id: string;
  status: string;
};

type ReviewState = {
  jobs: ReviewJob[];
  upsert: (job: ReviewJob) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const storeCreator: StateCreator<ReviewState, [], []> = (set) => ({
  jobs: [],
  upsert: (job: ReviewJob) =>
    set((state: ReviewState) => {
      const existing = state.jobs.find((item) => item.id === job.id);
      if (existing) {
        return {
          jobs: state.jobs.map((item) => (item.id === job.id ? job : item)),
        };
      }
      return { jobs: [...state.jobs, job] };
    }),
  remove: (id: string) =>
    set((state: ReviewState) => ({
      jobs: state.jobs.filter((item) => item.id !== id),
    })),
  clear: () => set({ jobs: [] }),
});

export const useReviewStore = create<ReviewState>(storeCreator);
