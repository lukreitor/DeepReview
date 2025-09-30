import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import { openReviewStream } from '@services/ws';
import { useAuthStore } from '@store/authStore';
import { useReviewStore } from '@store/reviewStore';
export const serializeReviewFilters = (filters) => {
    if (!filters) {
        return undefined;
    }
    const params = {};
    if (filters.language) {
        params.language = filters.language;
    }
    if (filters.status) {
        params.status = filters.status;
    }
    if (typeof filters.minScore === 'number' && !Number.isNaN(filters.minScore)) {
        params.min_score = filters.minScore;
    }
    if (filters.fromDate) {
        const fromIso = new Date(filters.fromDate).toISOString();
        params.from = fromIso;
    }
    if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        // Include the end date fully by nudging to the end of the day when no explicit time is provided.
        if (filters.toDate.length <= 10) {
            toDate.setHours(23, 59, 59, 999);
        }
        params.to = toDate.toISOString();
    }
    if (Object.keys(params).length === 0) {
        return undefined;
    }
    return params;
};
export const useCreateReview = () => {
    const queryClient = useQueryClient();
    const upsertJob = useReviewStore((state) => state.upsert);
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await apiClient.post('/reviews', payload);
            return data;
        },
        onSuccess: (data) => {
            upsertJob({ id: data.id, status: data.status, cached: data.cached });
            void queryClient.invalidateQueries({ queryKey: ['reviews'] });
            void queryClient.invalidateQueries({ queryKey: ['review-summary'] });
        },
    });
};
export const useListReviews = (filters) => useQuery({
    queryKey: ['reviews', filters ?? {}],
    queryFn: async () => {
        const params = serializeReviewFilters(filters);
        const { data } = await apiClient.get('/reviews', { params });
        return data;
    },
    refetchInterval: 120000,
});
export const useReviewSummary = () => useQuery({
    queryKey: ['review-summary'],
    queryFn: async () => {
        const { data } = await apiClient.get('/reviews/analytics/summary');
        return data;
    },
    staleTime: 60000,
});
export const useReviewStream = () => {
    const token = useAuthStore((state) => state.token);
    const upsertJob = useReviewStore((state) => state.upsert);
    const removeJob = useReviewStore((state) => state.remove);
    const queryClient = useQueryClient();
    useEffect(() => {
        if (!token) {
            return;
        }
        const socket = openReviewStream(token, (event) => {
            if (typeof event.submissionId === 'string' && typeof event.status === 'string') {
                upsertJob({
                    id: event.submissionId,
                    status: event.status,
                    cached: Boolean(event.cached),
                    score: typeof event.score === 'number' ? event.score : undefined,
                });
                void queryClient.invalidateQueries({ queryKey: ['reviews'] });
                void queryClient.invalidateQueries({ queryKey: ['review-summary'] });
                if (['completed', 'failed', 'cached'].includes(event.status)) {
                    window.setTimeout(() => {
                        removeJob(event.submissionId);
                    }, 3000);
                }
            }
        });
        return () => {
            socket.close(1000, 'component-unmount');
        };
    }, [token, upsertJob, removeJob, queryClient]);
};
