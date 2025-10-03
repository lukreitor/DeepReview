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
    if (typeof filters.page === 'number' && filters.page > 0) {
        params.page = filters.page;
    }
    if (typeof filters.pageSize === 'number' && filters.pageSize > 0) {
        params.page_size = filters.pageSize;
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
        onSuccess: (data, variables) => {
            upsertJob({
                id: data.id,
                status: data.status,
                cached: data.cached,
                language: variables.language,
                source: variables.source,
                submittedAt: new Date().toISOString(),
            });
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
    const completedJobTtl = 60000;
    useEffect(() => {
        if (!token) {
            return;
        }
        const socket = openReviewStream(token, (event) => {
            const submissionId = event.submissionId;
            if (typeof submissionId === 'string' && typeof event.status === 'string') {
                upsertJob({
                    id: submissionId,
                    status: event.status,
                    cached: Boolean(event.cached),
                    score: typeof event.score === 'number' ? event.score : undefined,
                    summary: typeof event.summary === 'string' ? event.summary : undefined,
                    provider: typeof event.provider === 'string' ? event.provider : undefined,
                    completedAt: ['completed', 'cached', 'failed'].includes(event.status)
                        ? new Date().toISOString()
                        : undefined,
                });
                void queryClient.invalidateQueries({ queryKey: ['reviews'] });
                void queryClient.invalidateQueries({ queryKey: ['review-summary'] });
                if (['completed', 'failed', 'cached'].includes(event.status)) {
                    void hydrateJobDetailsWithRetry(submissionId, Boolean(event.cached), event.status, upsertJob);
                    window.setTimeout(() => {
                        removeJob(submissionId);
                    }, completedJobTtl);
                }
            }
        });
        return () => {
            socket.close(1000, 'component-unmount');
        };
    }, [token, upsertJob, removeJob, queryClient]);
};
const hydrateJobDetails = async (submissionId, cached, status, upsertJob) => {
    const { data } = await apiClient.get(`/reviews/${submissionId}`);
    upsertJob({
        id: submissionId,
        status: status || data.submission.status,
        cached,
        score: data.review?.score ?? undefined,
        language: data.submission.language,
        source: data.submission.source,
        summary: data.review?.summary ?? null,
        issues: data.review?.issues ?? [],
        improvedCode: data.review?.improved_code ?? null,
        submittedAt: data.submission.created_at,
        completedAt: data.review?.created_at ?? data.submission.updated_at,
        requestId: data.submission.request_id,
        metadata: data.submission.metadata,
        transcriptText: data.submission.transcript_text,
        transcriptConfidence: data.submission.transcript_confidence ?? null,
        provider: data.review?.provider,
        securityConcerns: data.review?.security_concerns ?? [],
        performanceRecommendations: data.review?.performance_recommendations ?? [],
        additionalSuggestions: data.review?.additional_suggestions ?? [],
    });
};
const hydrateJobDetailsWithRetry = async (submissionId, cached, status, upsertJob) => {
    const delays = [0, 400, 1200];
    for (let attempt = 0; attempt < delays.length; attempt += 1) {
        if (delays[attempt] > 0) {
            await new Promise((resolve) => window.setTimeout(resolve, delays[attempt]));
        }
        try {
            await hydrateJobDetails(submissionId, cached, status, upsertJob);
            return;
        }
        catch (error) {
            if (attempt === delays.length - 1) {
                console.error('Failed to hydrate review job details after retries', error);
            }
        }
    }
};
