import { create } from 'zustand';

export type ReviewJob = {
  id: string;
  status: string;
  cached?: boolean;
  score?: number;
  language?: string;
  source?: string;
  provider?: string;
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
  transcriptConfidence?: number | null;
  securityConcerns?: string[];
  performanceRecommendations?: string[];
  additionalSuggestions?: string[];
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

const parseDate = (value?: string): number => {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortJobs = (jobs: ReviewJob[]): ReviewJob[] => {
  if (jobs.length <= 1) {
    return jobs;
  }
  return [...jobs].sort((a, b) => {
    const submittedDiff = parseDate(b.submittedAt) - parseDate(a.submittedAt);
    if (submittedDiff !== 0) {
      return submittedDiff;
    }
    return parseDate(b.completedAt) - parseDate(a.completedAt);
  });
};

const mergeJob = (existing: ReviewJob | undefined, incoming: ReviewJob): ReviewJob => {
  if (!existing) {
    return { ...incoming };
  }
  const next: ReviewJob = { ...existing };
  Object.keys(incoming).forEach((key) => {
    const typedKey = key as keyof ReviewJob;
    const value = incoming[typedKey];
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value as unknown;
    }
  });
  return next;
};

const storeCreator = (set: Setter) => ({
  jobs: [] as ReviewJob[],
  upsert: (job: ReviewJob) =>
    set((state: ReviewState) => {
      const existing = state.jobs.find((item: ReviewJob) => item.id === job.id);
      if (existing) {
        const jobs = state.jobs.map((item: ReviewJob) =>
          item.id === job.id ? mergeJob(existing, job) : item
        );
        return { jobs: sortJobs(jobs) };
      }
      const nextJob = mergeJob(undefined, job);
      return { jobs: sortJobs([nextJob, ...state.jobs]) };
    }),
  remove: (id: string) =>
    set((state: ReviewState) => ({
      jobs: state.jobs.filter((item: ReviewJob) => item.id !== id),
    })),
  clear: () => set({ jobs: [] }),
});

export const useReviewStore = create<ReviewState>(storeCreator);
