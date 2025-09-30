import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
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
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Suspense, lazy, useMemo, useState } from 'react';
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

export const DashboardPage = () => {
  const toast = useToast();
  const [filters, setFilters] = useState<ReviewListFilters>({});
  const [isExporting, setIsExporting] = useState(false);

  const { data: reviewsData, isLoading: loadingReviews } = useListReviews(filters);
  const { data: summary, isLoading: loadingSummary } = useReviewSummary();

  const filteredCount = reviewsData?.filteredTotal ?? reviewsData?.items.length ?? 0;
  const totalCount = reviewsData?.total ?? filteredCount;

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
  };

  const resetFilters = () => setFilters({});

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
              : summary?.turnaroundHours
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

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
      <Card>
        <CardHeader>
          <Heading size="md">Throughput (last 7 days)</Heading>
        </CardHeader>
        <CardBody height="250px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary?.throughput.daily ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3182ce" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <Heading size="md">Most frequent issue categories</Heading>
        </CardHeader>
        <CardBody height="250px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary?.commonIssues ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#805AD5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </SimpleGrid>
  );
};

type RecentReviewsProps = {
  loading: boolean;
  reviews: NonNullable<ReturnType<typeof useListReviews>['data']>['items'];
  summary?: NonNullable<ReturnType<typeof useListReviews>['data']>['summary'];
};

const RecentReviews = ({ loading, reviews, summary }: RecentReviewsProps) => (
  <Card>
    <CardHeader>
      <Heading size="md">Recent reviews</Heading>
      <Text fontSize="sm" color="gray.500">
        See the latest submissions and compare them with the suggested AI improvements.
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
      {loading && <Text>Loading reviews…</Text>}
      {!loading && !reviews.length && <Text>No reviews found yet.</Text>}
      <Stack spacing={8} divider={<Divider />}>
        {reviews
          .filter((item) => item?.submission)
          .map(({ submission, review }) => {
            const submissionId = String(submission.id ?? '');
            if (!submissionId) {
              return null;
            }
            const languageLabel = submission.language
              ? submission.language.toUpperCase()
              : 'UNKNOWN';
            const shortId = submissionId.length > 6 ? submissionId.slice(-6) : submissionId;

            return (
              <Stack key={submissionId} spacing={3}>
                <Heading size="sm">
                  {languageLabel} • #{shortId}
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Status: {submission.status}
                </Text>
                {review?.summary && <Text>{review.summary}</Text>}
                {review?.issues?.length ? (
                  <Stack spacing={2}>
                    {review.issues.map((issue, index) => (
                      <Badge key={`${submissionId}-issue-${index}`} colorScheme="orange">
                        {issue.severity.toUpperCase()} • {issue.category}: {issue.description}
                      </Badge>
                    ))}
                  </Stack>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    No critical issues highlighted.
                  </Text>
                )}
                <Suspense
                  fallback={
                    <Text fontSize="sm" color="gray.400">
                      Loading diff…
                    </Text>
                  }
                >
                  <ReviewDiff
                    original={submission.content}
                    improved={review?.improved_code}
                    language={submission.language}
                  />
                </Suspense>
              </Stack>
            );
          })}
      </Stack>
    </CardBody>
  </Card>
);
