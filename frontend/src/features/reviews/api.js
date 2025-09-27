import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import { openReviewStream } from '@services/ws';
import { useAuthStore } from '@store/authStore';
import { useReviewStore } from '@store/reviewStore';
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
export const useListReviews = () => useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
        const { data } = await apiClient.get('/reviews');
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
            }
        });
        return () => {
            socket.close(1000, 'component-unmount');
        };
    }, [token, upsertJob, queryClient]);
};
