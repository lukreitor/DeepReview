import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Collapse,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { Fragment, Suspense, lazy, useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const ReviewDiff = lazy(() =>
  import('@components/ReviewDiff').then((module) => ({ default: module.ReviewDiff }))
);
import {
  serializeReviewFilters,
  type ReviewListFilters,
  useListReviews,
  useReviewSummary,
} from '@features/reviews/api';
import { apiClient, getApiErrorMessage } from '@services/api';

const LANGUAGE_OPTIONS = [
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Go', value: 'go' },
  { label: 'Java', value: 'java' },
];

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cached', value: 'cached' },
  { label: 'Failed', value: 'failed' },
];

const STATUS_COLOR_MAP: Record<string, string> = {
  pending: 'yellow',
  processing: 'blue',
  completed: 'green',
  cached: 'green',
  failed: 'red',
};

export const DashboardPage = () => {
  const toast = useToast();
  const [filters, setFilters] = useState<ReviewListFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const queryFilters = useMemo(() => ({ ...filters, page, pageSize }), [filters, page, pageSize]);

  const { data: reviewsData, isLoading: loadingReviews } = useListReviews(queryFilters);
  const { data: summary, isLoading: loadingSummary } = useReviewSummary();

  const filteredCount = reviewsData?.filteredTotal ?? reviewsData?.items.length ?? 0;
  const totalCount = reviewsData?.total ?? filteredCount;
  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  const handleFilterChange = <K extends keyof ReviewListFilters>(
    key: K,
    value: ReviewListFilters[K]
  ) => {
    setFilters((prev) => {
      const next: ReviewListFilters = { ...prev };
      const shouldRemove =
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'number' && Number.isNaN(value));

      if (shouldRemove) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    if (page !== 1) {
      setPage(1);
    }
  };

  const resetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage === page) {
      return;
    }
    if (reviewsData && totalPages && nextPage > totalPages) {
      return;
    }
    setPage(nextPage);
  };

  const handlePageSizeChange = (nextSize: number) => {
    if (nextSize <= 0 || nextSize === pageSize) {
      return;
    }
    setPageSize(nextSize);
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = serializeReviewFilters(filters);
      const response = await apiClient.get('/reviews/export', {
        params,
        responseType: 'blob',
      });
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `deepreview-export-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Export ready', status: 'success' });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: getApiErrorMessage(error, 'Unable to generate the CSV right now.'),
        status: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Stack spacing={8}>
      <AnalyticsHeader summaryLoading={loadingSummary} summary={summary} />
      <ReviewFiltersPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        onExport={handleExport}
        exporting={isExporting}
        loading={loadingReviews}
        resultCount={filteredCount}
        totalCount={totalCount}
      />
      <AnalyticsCharts summaryLoading={loadingSummary} summary={summary} />
      <RecentReviews
        loading={loadingReviews}
        reviews={reviewsData?.items ?? []}
        summary={reviewsData?.summary}
        page={page}
        pageSize={pageSize}
        total={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </Stack>
  );
};

type AnalyticsHeaderProps = {
  summaryLoading: boolean;
  summary?: ReturnType<typeof useReviewSummary> extends { data: infer D } ? D : never;
};

const AnalyticsHeader = ({ summaryLoading, summary }: AnalyticsHeaderProps) => (
  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
    <Card>
      <CardBody>
        <Stat>
          <StatLabel>Average score</StatLabel>
          <StatNumber>
            {summaryLoading ? '…' : summary?.avgScore != null ? summary.avgScore.toFixed(2) : '—'}
          </StatNumber>
          <StatHelpText>Across completed reviews</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
    <Card>
      <CardBody>
        <Stat>
          <StatLabel>In queue</StatLabel>
          <StatNumber>{summaryLoading ? '…' : (summary?.pending ?? 0)}</StatNumber>
          <StatHelpText>Submissions awaiting processing</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
    <Card>
      <CardBody>
        <Stat>
          <StatLabel>Average turnaround</StatLabel>
          <StatNumber>
            {summaryLoading
              ? '…'
              : summary?.turnaroundHours != null
                ? `${summary.turnaroundHours.toFixed(1)} h`
                : '—'}
          </StatNumber>
          <StatHelpText>From submission to final review</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  </SimpleGrid>
);

type ReviewFiltersPanelProps = {
  filters: ReviewListFilters;
  onFilterChange: <K extends keyof ReviewListFilters>(key: K, value: ReviewListFilters[K]) => void;
  onReset: () => void;
  onExport: () => Promise<void>;
  exporting: boolean;
  loading: boolean;
  resultCount: number;
  totalCount: number;
};

const ReviewFiltersPanel = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  exporting,
  loading,
  resultCount,
  totalCount,
}: ReviewFiltersPanelProps) => {
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  return (
    <Card>
      <CardBody>
        <Stack spacing={4}>
          <HStack
            justify={{ base: 'flex-start', md: 'space-between' }}
            align={{ base: 'flex-start', md: 'center' }}
            flexWrap="wrap"
            gap={4}
          >
            <Text fontSize="sm" color="gray.500">
              {loading ? 'Loading reviews…' : `Showing ${resultCount} of ${totalCount} submissions`}
            </Text>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onReset} isDisabled={!hasActiveFilters}>
                Reset filters
              </Button>
              <Button
                colorScheme="brand"
                onClick={() => {
                  void onExport();
                }}
                isLoading={exporting}
              >
                Export CSV
              </Button>
            </HStack>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Language</FormLabel>
              <Select
                value={filters.language ?? ''}
                onChange={(event) => onFilterChange('language', event.target.value || undefined)}
              >
                <option value="">All languages</option>
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Status</FormLabel>
              <Select
                value={filters.status ?? ''}
                onChange={(event) => onFilterChange('status', event.target.value || undefined)}
              >
                <option value="">Any status</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Minimum score</FormLabel>
              <NumberInput
                value={filters.minScore ?? ''}
                min={0}
                max={10}
                step={0.5}
                precision={1}
                onChange={(valueAsString, valueAsNumber) =>
                  onFilterChange('minScore', valueAsString === '' ? undefined : valueAsNumber)
                }
              >
                <NumberInputField placeholder="0-10" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">From date</FormLabel>
              <Input
                type="date"
                value={filters.fromDate ?? ''}
                max={filters.toDate}
                onChange={(event) => onFilterChange('fromDate', event.target.value || undefined)}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">To date</FormLabel>
              <Input
                type="date"
                value={filters.toDate ?? ''}
                min={filters.fromDate}
                onChange={(event) => onFilterChange('toDate', event.target.value || undefined)}
              />
            </FormControl>
          </SimpleGrid>
        </Stack>
      </CardBody>
    </Card>
  );
};

type AnalyticsChartsProps = {
  summaryLoading: boolean;
  summary?: ReturnType<typeof useReviewSummary> extends { data: infer D } ? D : never;
};

const AnalyticsCharts = ({ summaryLoading, summary }: AnalyticsChartsProps) => {
  if (summaryLoading) {
    return null;
  }

  const throughputData = summary?.throughput.daily ?? [];
  const issueData = summary?.commonIssues ?? [];
  const hasThroughput = throughputData.length > 0;
  const hasIssues = issueData.length > 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
      <Card>
        <CardHeader>
          <Heading size="md">Throughput (last 7 days)</Heading>
        </CardHeader>
        <CardBody height="250px">
          {hasThroughput ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3182ce" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Center height="100%">
              <Text fontSize="sm" color="gray.500" textAlign="center">
                No submissions recorded in the last 7 days yet.
              </Text>
            </Center>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <Heading size="md">Most frequent issue categories</Heading>
        </CardHeader>
        <CardBody height="250px">
          {hasIssues ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#805AD5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Center height="100%">
              <Text fontSize="sm" color="gray.500" textAlign="center">
                No recurring issues detected yet.
              </Text>
            </Center>
          )}
        </CardBody>
      </Card>
    </SimpleGrid>
  );
};

type RecentReviewsProps = {
  loading: boolean;
  reviews: NonNullable<ReturnType<typeof useListReviews>['data']>['items'];
  summary?: NonNullable<ReturnType<typeof useListReviews>['data']>['summary'];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const RecentReviews = ({
  loading,
  reviews,
  summary,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: RecentReviewsProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const hasReviews = reviews.length > 0;

  const toggleRow = (submissionId: string) => {
    setExpandedId((current) => (current === submissionId ? null : submissionId));
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Recent reviews</Heading>
        <Text fontSize="sm" color="gray.500">
          Explore every submission that matches your filters, with summaries, issues, and AI diffs.
        </Text>
        {summary && (
          <HStack spacing={3} mt={3} flexWrap="wrap">
            <Badge colorScheme="green" variant="subtle">
              Completed {summary.completed}
            </Badge>
            <Badge colorScheme="yellow" variant="subtle">
              Pending {summary.pending}
            </Badge>
            <Badge colorScheme="red" variant="subtle">
              Failed {summary.failed}
            </Badge>
            {summary.avgScore != null && (
              <Badge colorScheme="purple" variant="subtle">
                Avg score {summary.avgScore.toFixed(2)}
              </Badge>
            )}
          </HStack>
        )}
      </CardHeader>
      <CardBody>
        {loading && (
          <HStack spacing={3} color="gray.500">
            <Spinner size="sm" />
            <Text>Loading reviews…</Text>
          </HStack>
        )}
        {!loading && !hasReviews && (
          <Text fontSize="sm" color="gray.600">
            No reviews found for the selected filters. Try adjusting language, status, or date range
            above.
          </Text>
        )}
        {hasReviews && (
          <Stack spacing={5}>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Language</Th>
                    <Th>Status</Th>
                    <Th>Score</Th>
                    <Th>Summary</Th>
                    <Th>Submitted</Th>
                    <Th>Completed</Th>
                    <Th>Source</Th>
                    <Th textAlign="right">Details</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {reviews.map(({ submission, review }) => {
                    const submissionId = String(submission.id ?? '');
                    if (!submissionId) {
                      return null;
                    }
                    const shortId = submissionId.slice(-6).toUpperCase();
                    const languageLabel = submission.language
                      ? submission.language.toUpperCase()
                      : 'UNKNOWN';
                    const status = submission.status?.toString() ?? 'unknown';
                    const statusColor = STATUS_COLOR_MAP[status] ?? 'gray';
                    const createdAt = submission.created_at
                      ? new Date(submission.created_at).toLocaleString()
                      : '—';
                    const completedAt = review?.created_at
                      ? new Date(review.created_at).toLocaleString()
                      : '—';
                    const summaryText = review?.summary ?? '—';
                    const scoreDisplay =
                      typeof review?.score === 'number' ? review.score.toFixed(2) : '—';
                    const issues = review?.issues ?? [];
                    const improvedCode = review?.improved_code ?? null;

                    return (
                      <Fragment key={submissionId}>
                        <Tr>
                          <Td fontFamily="mono">#{shortId}</Td>
                          <Td>
                            <Badge colorScheme="blue" variant="subtle">
                              {languageLabel}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={statusColor}>{status.toUpperCase()}</Badge>
                          </Td>
                          <Td>{scoreDisplay}</Td>
                          <Td maxW="280px">
                            <Text noOfLines={2}>{summaryText}</Text>
                          </Td>
                          <Td>{createdAt}</Td>
                          <Td>{completedAt}</Td>
                          <Td textTransform="capitalize">{submission.source ?? 'code'}</Td>
                          <Td textAlign="right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleRow(submissionId)}
                            >
                              {expandedId === submissionId ? 'Hide details' : 'View details'}
                            </Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td colSpan={9} border="none" p={0} bg="transparent">
                            <Collapse in={expandedId === submissionId} animateOpacity>
                              <Box px={4} py={4} bg="gray.50">
                                <Stack spacing={3} fontSize="sm" color="gray.700">
                                  <Text fontWeight="semibold">AI summary</Text>
                                  <Text>{summaryText}</Text>
                                  <Text fontWeight="semibold">Issues</Text>
                                  {issues.length ? (
                                    <Stack spacing={1}>
                                      {issues.map((issue, index) => (
                                        <Badge
                                          key={`${submissionId}-issue-${index}`}
                                          colorScheme="orange"
                                          alignSelf="flex-start"
                                        >
                                          {issue.severity?.toUpperCase() ?? 'ISSUE'} ·{' '}
                                          {issue.category}:{' '}
                                          {issue.description ?? 'No description provided'}
                                        </Badge>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <Text color="gray.500">No critical issues highlighted.</Text>
                                  )}
                                  {improvedCode && (
                                    <Stack spacing={2}>
                                      <Text fontWeight="semibold">Suggested diff</Text>
                                      <Suspense
                                        fallback={
                                          <Text fontSize="sm" color="gray.400">
                                            Loading diff…
                                          </Text>
                                        }
                                      >
                                        <ReviewDiff
                                          original={submission.content}
                                          improved={improvedCode}
                                          language={submission.language}
                                        />
                                      </Suspense>
                                    </Stack>
                                  )}
                                </Stack>
                              </Box>
                            </Collapse>
                          </Td>
                        </Tr>
                      </Fragment>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Button size="sm" onClick={() => onPageChange(page - 1)} isDisabled={page <= 1}>
                  Previous
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Page {page} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  isDisabled={page >= totalPages}
                >
                  Next
                </Button>
              </HStack>
              <HStack spacing={2} align="center">
                <Text fontSize="sm" color="gray.500">
                  Rows per page
                </Text>
                <Select
                  size="sm"
                  width="auto"
                  value={pageSize}
                  onChange={(event) => onPageSizeChange(Number(event.target.value))}
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>
              </HStack>
            </HStack>
          </Stack>
        )}
      </CardBody>
    </Card>
  );
};
