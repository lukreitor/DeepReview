import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api';

export type SubmissionPayload = {
  language: string;
  source: 'code' | 'audio';
  content: string;
  metadata?: Record<string, unknown>;
};

export type SubmissionResponse = {
  id: string;
  status: string;
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmissionPayload) => {
      const { data } = await apiClient.post<SubmissionResponse>('/reviews', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useListReviews = () =>
  useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: unknown[] }>('/reviews');
      return data;
    },
  });
