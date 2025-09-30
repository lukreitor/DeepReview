import { Badge, Box, Code, HStack, Spinner, Stack, Text } from '@chakra-ui/react';

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
  const isFinalState = ['completed', 'cached', 'failed'].includes(job.status);
  const languageLabel = job.language ? job.language.toUpperCase() : 'UNKNOWN';
  const sourceLabel = job.source === 'audio' ? 'Audio' : 'Code';
  const submittedAt = job.submittedAt ? new Date(job.submittedAt).toLocaleTimeString() : undefined;
  const completedAt = job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : undefined;
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
      alignItems="flex-start"
    >
      <Stack spacing={2} flex={1} pr={4}>
        <Stack spacing={0}>
          <Text fontWeight="medium">Submission #{job.id.slice(-6)}</Text>
          <Text fontSize="sm" color="gray.500">
            {languageLabel} · {sourceLabel}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {submittedAt ? `Submitted ${submittedAt}` : 'Submission queued'}
            {completedAt ? ` · Completed ${completedAt}` : ''}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {job.cached
              ? 'Served from cache'
              : isFinalState
                ? 'Review ready'
                : 'Awaiting AI response'}
          </Text>
        </Stack>
        {isFinalState && (
          <Stack spacing={2} fontSize="sm" color="gray.600">
            {job.summary && <Text>{job.summary}</Text>}
            {job.issues?.length ? (
              <Stack spacing={1}>
                {job.issues.map((issue, index) => (
                  <Badge
                    key={`${job.id}-issue-${index}`}
                    colorScheme="orange"
                    alignSelf="flex-start"
                  >
                    {issue.severity?.toUpperCase() ?? 'ISSUE'} · {issue.category}:{' '}
                    {issue.description}
                  </Badge>
                ))}
              </Stack>
            ) : (
              <Text color="gray.500">No critical issues reported.</Text>
            )}
            {job.improvedCode && (
              <Box bg="gray.50" borderRadius="md" p={3} borderWidth="1px" borderColor="gray.100">
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Suggested snippet
                </Text>
                <Code whiteSpace="pre" display="block" overflowX="auto">
                  {job.improvedCode.slice(0, 600)}
                  {job.improvedCode.length > 600 ? '…' : ''}
                </Code>
              </Box>
            )}
          </Stack>
        )}
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
