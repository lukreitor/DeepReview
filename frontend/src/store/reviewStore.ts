import { create } from 'zustand';

export type ReviewJob = {
  id: string;
  status: string;
  cached?: boolean;
  score?: number;
  language?: string;
  source?: string;
  summary?: string | null;
  issues?: Array<{
    severity: string;
    category: string;
    description?: string | null;
    recommendation?: string | null;
  }>;
  improvedCode?: string | null;
  submittedAt?: string;
  completedAt?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  transcriptText?: string | null;
};

export type ReviewState = {
  jobs: ReviewJob[];
  upsert: (job: ReviewJob) => void;
  remove: (id: string) => void;
  clear: () => void;
};

type Setter = (
  updater:
    | ReviewState
    | Partial<ReviewState>
    | ((state: ReviewState) => ReviewState | Partial<ReviewState>)
) => void;

const storeCreator = (set: Setter) => ({
  jobs: [],
  upsert: (job: ReviewJob) =>
    set((state: ReviewState) => {
      const existing = state.jobs.find((item: ReviewJob) => item.id === job.id);
      if (existing) {
        return {
          jobs: state.jobs.map((item: ReviewJob) =>
            item.id === job.id ? { ...existing, ...job } : item
          ),
        };
      }
      return { jobs: [...state.jobs, job] };
    }),
  remove: (id: string) =>
    set((state: ReviewState) => ({
      jobs: state.jobs.filter((item: ReviewJob) => item.id !== id),
    })),
  clear: () => set({ jobs: [] }),
});

export const useReviewStore = create<ReviewState>(storeCreator);
