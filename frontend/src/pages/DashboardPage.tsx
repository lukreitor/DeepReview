import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import { Suspense, lazy } from 'react';
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
import { useListReviews, useReviewSummary } from '@features/reviews/api';

export const DashboardPage = () => {
  const { data: reviewsData, isLoading: loadingReviews } = useListReviews();
  const { data: summary, isLoading: loadingSummary } = useReviewSummary();

  return (
    <Stack spacing={8}>
      <AnalyticsHeader summaryLoading={loadingSummary} summary={summary} />
      <AnalyticsCharts summaryLoading={loadingSummary} summary={summary} />
      <RecentReviews loading={loadingReviews} reviews={reviewsData?.items ?? []} />
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
          <StatNumber>{summaryLoading ? '…' : summary?.pending ?? 0}</StatNumber>
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
};

const RecentReviews = ({ loading, reviews }: RecentReviewsProps) => (
  <Card>
    <CardHeader>
      <Heading size="md">Recent reviews</Heading>
      <Text fontSize="sm" color="gray.500">
        See the latest submissions and compare them with the suggested AI improvements.
      </Text>
    </CardHeader>
    <CardBody>
      {loading && <Text>Loading reviews…</Text>}
      {!loading && !reviews.length && <Text>No reviews found yet.</Text>}
      <Stack spacing={8} divider={<Divider />}>
        {reviews.map(({ submission, review }) => (
          <Stack key={submission.id} spacing={3}>
            <Heading size="sm">
              {submission.language.toUpperCase()} • #{submission.id.slice(-6)}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Status: {submission.status}
            </Text>
            {review?.summary && <Text>{review.summary}</Text>}
            {review?.issues?.length ? (
              <Stack spacing={2}>
                {review.issues.map((issue, index) => (
                  <Badge key={`${submission.id}-issue-${index}`} colorScheme="orange">
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
        ))}
      </Stack>
    </CardBody>
  </Card>
);
