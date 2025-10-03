import {
  Badge,
  Box,
  Button,
  Code,
  Divider,
  HStack,
  Icon,
  List,
  ListItem,
  Spinner,
  Stack,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  MdCheckCircle,
  MdClose,
  MdLightbulb,
  MdOutlineSubtitles,
  MdSecurity,
  MdSpeed,
} from 'react-icons/md';

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

const severityToColorScheme: Record<string, string> = {
  critical: 'red',
  high: 'red',
  medium: 'orange',
  low: 'yellow',
  info: 'blue',
  suggestion: 'purple',
};

const formatTime = (iso?: string) => {
  if (!iso) {
    return undefined;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const normaliseMetadataValue = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Unable to stringify metadata value', error);
    return '';
  }
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
  const submittedAt = formatTime(job.submittedAt);
  const completedAt = formatTime(job.completedAt);
  const providerLabel = job.provider ? job.provider.toUpperCase() : 'AI';
  const metadataEntries = Object.entries(job.metadata ?? {}).filter(
    ([, value]) => value !== undefined && value !== null
  );
  const transcriptPreview = job.transcriptText?.trim();
  const confidenceLabel =
    job.transcriptConfidence != null
      ? `Confidence ${(job.transcriptConfidence * 100).toFixed(0)}%`
      : undefined;
  const removeJob = useReviewStore((state: ReviewState) => state.remove);

  return (
    <Stack
      borderWidth="1px"
      borderRadius="lg"
      px={4}
      py={4}
      borderColor="gray.200"
      bg="white"
      boxShadow="sm"
      spacing={4}
    >
      <HStack align="flex-start" justify="space-between" spacing={6}>
        <Stack spacing={1} flex={1} pr={2}>
          <Text fontWeight="medium">Submission #{job.id.slice(-6)}</Text>
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme="blue" variant="subtle">
              {languageLabel}
            </Badge>
            <Badge colorScheme="teal" variant="outline">
              {sourceLabel}
            </Badge>
            {job.cached && (
              <Tooltip label="Result served from review cache">
                <Badge colorScheme="purple" variant="solid">
                  Cached hit
                </Badge>
              </Tooltip>
            )}
            <Badge colorScheme="gray" variant="subtle">
              Provider {providerLabel}
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.400">
            {submittedAt ? `Submitted ${submittedAt}` : 'Submission queued'}
            {completedAt ? ` · Completed ${completedAt}` : ''}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {job.cached
              ? 'Served instantly from cache. You can still inspect the AI output below.'
              : isFinalState
                ? 'Review ready — explore the AI summary, issues, and suggestions.'
                : 'Awaiting AI response. Keep this tab open to watch progress in real time.'}
          </Text>
          {metadataEntries.length > 0 && (
            <Wrap spacing={2} pt={1}>
              {metadataEntries.map(([key, value]) => {
                const rendered = normaliseMetadataValue(value);
                if (!rendered) {
                  return null;
                }
                return (
                  <WrapItem key={`${job.id}-${key}`}>
                    <Badge variant="outline" colorScheme="purple">
                      {key}: {rendered}
                    </Badge>
                  </WrapItem>
                );
              })}
            </Wrap>
          )}
        </Stack>
        <Stack spacing={2} align="flex-end" minW="120px">
          {job.status === 'processing' && <Spinner size="sm" />}
          <Badge colorScheme={color}>{label}</Badge>
          {typeof job.score === 'number' && (
            <Tooltip label="AI quality score (0-10)">
              <Box fontSize="sm" fontWeight="semibold" color="gray.600">
                Score {job.score.toFixed(1)}
              </Box>
            </Tooltip>
          )}
          {isFinalState && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="gray"
              leftIcon={<Icon as={MdClose} />}
              onClick={() => removeJob(job.id)}
            >
              Dismiss
            </Button>
          )}
        </Stack>
      </HStack>
      {isFinalState && (
        <Stack spacing={4} fontSize="sm" color="gray.700">
          {job.summary && <Text>{job.summary}</Text>}
          {job.issues?.length ? (
            <Stack spacing={3}>
              {job.issues.map((issue, index) => {
                const severityKey = issue.severity?.toLowerCase() ?? 'suggestion';
                const badgeColor = severityToColorScheme[severityKey] ?? 'orange';
                return (
                  <Box
                    key={`${job.id}-issue-${index}`}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="gray.100"
                    p={3}
                    bg="gray.50"
                  >
                    <HStack spacing={2} align="center" mb={1}>
                      <Badge colorScheme={badgeColor}>
                        {issue.severity?.toUpperCase() ?? 'ISSUE'}
                      </Badge>
                      <Text fontWeight="semibold">{issue.category}</Text>
                    </HStack>
                    {issue.description && (
                      <Text color="gray.700" mb={1}>
                        {issue.description}
                      </Text>
                    )}
                    {issue.recommendation && (
                      <Text color="gray.600">Recommendation: {issue.recommendation}</Text>
                    )}
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Text color="gray.500">No critical issues reported.</Text>
          )}
          {(job.securityConcerns?.length ?? 0) > 0 && (
            <Box>
              <HStack spacing={2} mb={1}>
                <Icon as={MdSecurity} color="red.500" />
                <Text fontWeight="semibold">Security concerns</Text>
              </HStack>
              <List spacing={1} pl={4} styleType="disc" color="gray.600">
                {job.securityConcerns?.map((item, idx) => (
                  <ListItem key={`${job.id}-security-${idx}`}>{item}</ListItem>
                ))}
              </List>
            </Box>
          )}
          {(job.performanceRecommendations?.length ?? 0) > 0 && (
            <Box>
              <HStack spacing={2} mb={1}>
                <Icon as={MdSpeed} color="orange.500" />
                <Text fontWeight="semibold">Performance recommendations</Text>
              </HStack>
              <List spacing={1} pl={4} styleType="disc" color="gray.600">
                {job.performanceRecommendations?.map((item, idx) => (
                  <ListItem key={`${job.id}-perf-${idx}`}>{item}</ListItem>
                ))}
              </List>
            </Box>
          )}
          {(job.additionalSuggestions?.length ?? 0) > 0 && (
            <Box>
              <HStack spacing={2} mb={1}>
                <Icon as={MdLightbulb} color="yellow.500" />
                <Text fontWeight="semibold">Additional suggestions</Text>
              </HStack>
              <List spacing={1} pl={4} styleType="disc" color="gray.600">
                {job.additionalSuggestions?.map((item, idx) => (
                  <ListItem key={`${job.id}-suggestion-${idx}`}>{item}</ListItem>
                ))}
              </List>
            </Box>
          )}
          {transcriptPreview && (
            <Box borderWidth="1px" borderRadius="md" borderColor="gray.100" p={3} bg="gray.50">
              <HStack spacing={2} mb={1} color="gray.600">
                <Icon as={MdOutlineSubtitles} />
                <Text fontWeight="semibold">Transcript</Text>
                {confidenceLabel && <Badge colorScheme="green">{confidenceLabel}</Badge>}
              </HStack>
              <Text color="gray.600">{transcriptPreview}</Text>
            </Box>
          )}
          {job.improvedCode && (
            <Box bg="gray.900" borderRadius="md" p={3} borderWidth="1px" borderColor="gray.800">
              <HStack spacing={2} mb={2} color="gray.100">
                <Icon as={MdCheckCircle} />
                <Text fontWeight="semibold">Suggested snippet</Text>
              </HStack>
              <Code
                whiteSpace="pre"
                display="block"
                overflowX="auto"
                fontSize="xs"
                bg="transparent"
                color="green.200"
              >
                {job.improvedCode.slice(0, 1200)}
                {job.improvedCode.length > 1200 ? '…' : ''}
              </Code>
            </Box>
          )}
        </Stack>
      )}
      {isFinalState && <Divider borderColor="gray.100" />}
    </Stack>
  );
};
