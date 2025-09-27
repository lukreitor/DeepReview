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
    <Box
      bg="gray.50"
      borderRadius="2xl"
      px={{ base: 4, md: 6 }}
      py={{ base: 5, md: 6 }}
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="md"
    >
      <Stack spacing={3}>
        <Text fontWeight="semibold" color="gray.700">
          Live queue
        </Text>
        <Stack spacing={3}>
          {jobs.map((job: ReviewJob) => (
            <QueueItem key={job.id} job={job} />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

const QueueItem = ({ job }: { job: ReviewJob }) => {
  const color = statusToColor[job.status] ?? 'gray';
  const label = statusToLabel[job.status] ?? job.status;
  return (
    <HStack
      justify="space-between"
      borderWidth="1px"
      borderRadius="lg"
      px={4}
      py={3}
      borderColor="gray.200"
      bg="white"
      boxShadow="sm"
    >
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
