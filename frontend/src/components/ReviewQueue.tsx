import { Badge, Box, HStack, Spinner, Stack, Text } from '@chakra-ui/react';

import { useReviewStore, type ReviewJob, type ReviewState } from '@store/reviewStore';

const statusToColor: Record<string, string> = {
  pending: 'yellow',
  processing: 'blue',
  completed: 'green',
  cached: 'green',
  failed: 'red',
};

const statusToLabel: Record<string, string> = {
  pending: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  cached: 'Cached',
  failed: 'Failed',
};

export const ReviewQueue = () => {
  const jobs = useReviewStore((state: ReviewState) => state.jobs);

  if (!jobs.length) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Text fontWeight="semibold">Live queue</Text>
      <Stack spacing={3}>
        {jobs.map((job: ReviewJob) => (
          <QueueItem key={job.id} job={job} />
        ))}
      </Stack>
    </Stack>
  );
};

const QueueItem = ({ job }: { job: ReviewJob }) => {
  const color = statusToColor[job.status] ?? 'gray';
  const label = statusToLabel[job.status] ?? job.status;
  return (
    <HStack justify="space-between" borderWidth="1px" borderRadius="md" px={3} py={2}>
      <Stack spacing={0}>
        <Text fontWeight="medium">Submission #{job.id.slice(-6)}</Text>
        <Text fontSize="sm" color="gray.500">
          {job.cached ? 'Served from cache' : 'Awaiting AI response'}
        </Text>
      </Stack>
      <HStack spacing={2}>
        {job.status === 'processing' && <Spinner size="sm" />}
        <Badge colorScheme={color}>{label}</Badge>
        {typeof job.score === 'number' && (
          <Box fontSize="sm" fontWeight="semibold" color="gray.600">
            Score {job.score.toFixed(1)}
          </Box>
        )}
      </HStack>
    </HStack>
  );
};
