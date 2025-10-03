import { create } from 'zustand';
const parseDate = (value) => {
    if (!value) {
        return 0;
    }
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
};
const sortJobs = (jobs) => {
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
const mergeJob = (existing, incoming) => {
    if (!existing) {
        return { ...incoming };
    }
    const next = { ...existing };
    Object.keys(incoming).forEach((key) => {
        const typedKey = key;
        const value = incoming[typedKey];
        if (value !== undefined) {
            next[key] = value;
        }
    });
    return next;
};
const storeCreator = (set) => ({
    jobs: [],
    upsert: (job) => set((state) => {
        const existing = state.jobs.find((item) => item.id === job.id);
        if (existing) {
            const jobs = state.jobs.map((item) => item.id === job.id ? mergeJob(existing, job) : item);
            return { jobs: sortJobs(jobs) };
        }
        const nextJob = mergeJob(undefined, job);
        return { jobs: sortJobs([nextJob, ...state.jobs]) };
    }),
    remove: (id) => set((state) => ({
        jobs: state.jobs.filter((item) => item.id !== id),
    })),
    clear: () => set({ jobs: [] }),
});
export const useReviewStore = create(storeCreator);
