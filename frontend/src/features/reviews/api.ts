import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@services/api';
import { openReviewStream } from '@services/ws';
import { useAuthStore, type AuthState } from '@store/authStore';
import { useReviewStore, type ReviewState } from '@store/reviewStore';

export type SubmissionPayload = {
  language?: string;
  source: 'code' | 'audio';
  content?: string;
  audio_base64?: string;
  metadata?: Record<string, unknown>;
};

export type SubmissionResponse = {
  id: string;
  status: string;
  cached: boolean;
  request_id: string;
};

export type ReviewIssue = {
  severity: string;
  category: string;
  description: string;
  recommendation: string;
};

export type ReviewItem = {
  submission: {
    id: string;
    language: string;
    status: string;
    content: string;
    created_at: string;
    updated_at: string;
    transcript_text?: string | null;
    metadata?: Record<string, unknown>;
  };
  review?: {
    score?: number | null;
    summary?: string | null;
    issues: ReviewIssue[];
    improved_code?: string | null;
    provider?: string;
  } | null;
};

export type ReviewListResponse = {
  items: ReviewItem[];
  page: number;
  pageSize: number;
  total: number;
  filteredTotal?: number;
  summary: {
    avgScore: number | null;
    pending: number;
    completed: number;
    failed: number;
  };
};

export type ReviewSummary = {
  avgScore: number | null;
  throughput: { daily: { date: string; count: number }[] };
  topLanguages: string[];
  commonIssues: { category: string; count: number }[];
  pending: number;
  completed: number;
  failed: number;
  turnaroundHours: number | null;
  lastUpdated: string;
};

export type ReviewListFilters = {
  language?: string;
  status?: string;
  minScore?: number;
  fromDate?: string;
  toDate?: string;
};

export const serializeReviewFilters = (filters?: ReviewListFilters) => {
  if (!filters) {
    return undefined;
  }

  const params: Record<string, string | number> = {};

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
  const upsertJob = useReviewStore((state: ReviewState) => state.upsert);
  return useMutation({
    mutationFn: async (payload: SubmissionPayload) => {
      const { data } = await apiClient.post<SubmissionResponse>('/reviews', payload);
      return data;
    },
    onSuccess: (data: SubmissionResponse) => {
      upsertJob({ id: data.id, status: data.status, cached: data.cached });
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['review-summary'] });
    },
  });
};

export const useListReviews = (filters?: ReviewListFilters) =>
  useQuery({
    queryKey: ['reviews', filters ?? {}],
    queryFn: async () => {
      const params = serializeReviewFilters(filters);
      const { data } = await apiClient.get<ReviewListResponse>('/reviews', { params });
      return data;
    },
    refetchInterval: 120000,
  });

export const useReviewSummary = () =>
  useQuery({
    queryKey: ['review-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<ReviewSummary>('/reviews/analytics/summary');
      return data;
    },
    staleTime: 60000,
  });

export const useReviewStream = () => {
  const token = useAuthStore((state: AuthState) => state.token);
  const upsertJob = useReviewStore((state: ReviewState) => state.upsert);
  const removeJob = useReviewStore((state: ReviewState) => state.remove);
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
            removeJob(event.submissionId as string);
          }, 3000);
        }
      }
    });

    return () => {
      socket.close(1000, 'component-unmount');
    };
  }, [token, upsertJob, removeJob, queryClient]);
};
