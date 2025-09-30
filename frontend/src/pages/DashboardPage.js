import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, Card, CardBody, CardHeader, Center, Collapse, FormControl, FormLabel, Heading, HStack, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, SimpleGrid, Spinner, Stack, Stat, StatHelpText, StatLabel, StatNumber, Table, Tbody, Td, Text, Th, Thead, Tr, useToast, } from '@chakra-ui/react';
import { Fragment, Suspense, lazy, useMemo, useState } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, } from 'recharts';
const ReviewDiff = lazy(() => import('@components/ReviewDiff').then((module) => ({ default: module.ReviewDiff })));
import { serializeReviewFilters, useListReviews, useReviewSummary, } from '@features/reviews/api';
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
const STATUS_COLOR_MAP = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    cached: 'green',
    failed: 'red',
};
export const DashboardPage = () => {
    const toast = useToast();
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isExporting, setIsExporting] = useState(false);
    const queryFilters = useMemo(() => ({ ...filters, page, pageSize }), [filters, page, pageSize]);
    const { data: reviewsData, isLoading: loadingReviews } = useListReviews(queryFilters);
    const { data: summary, isLoading: loadingSummary } = useReviewSummary();
    const filteredCount = reviewsData?.filteredTotal ?? reviewsData?.items.length ?? 0;
    const totalCount = reviewsData?.total ?? filteredCount;
    const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const handleFilterChange = (key, value) => {
        setFilters((prev) => {
            const next = { ...prev };
            const shouldRemove = value === undefined ||
                value === null ||
                value === '' ||
                (typeof value === 'number' && Number.isNaN(value));
            if (shouldRemove) {
                delete next[key];
            }
            else {
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
    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage === page) {
            return;
        }
        if (reviewsData && totalPages && nextPage > totalPages) {
            return;
        }
        setPage(nextPage);
    };
    const handlePageSizeChange = (nextSize) => {
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
            const blob = response.data;
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
        }
        catch (error) {
            toast({
                title: 'Export failed',
                description: getApiErrorMessage(error, 'Unable to generate the CSV right now.'),
                status: 'error',
            });
        }
        finally {
            setIsExporting(false);
        }
    };
    return (_jsxs(Stack, { spacing: 8, children: [_jsx(AnalyticsHeader, { summaryLoading: loadingSummary, summary: summary }), _jsx(ReviewFiltersPanel, { filters: filters, onFilterChange: handleFilterChange, onReset: resetFilters, onExport: handleExport, exporting: isExporting, loading: loadingReviews, resultCount: filteredCount, totalCount: totalCount }), _jsx(AnalyticsCharts, { summaryLoading: loadingSummary, summary: summary }), _jsx(RecentReviews, { loading: loadingReviews, reviews: reviewsData?.items ?? [], summary: reviewsData?.summary, page: page, pageSize: pageSize, total: totalCount, onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange })] }));
};
const AnalyticsHeader = ({ summaryLoading, summary }) => (_jsxs(SimpleGrid, { columns: { base: 1, md: 3 }, spacing: 6, children: [_jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { children: "Average score" }), _jsx(StatNumber, { children: summaryLoading ? '…' : summary?.avgScore != null ? summary.avgScore.toFixed(2) : '—' }), _jsx(StatHelpText, { children: "Across completed reviews" })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { children: "In queue" }), _jsx(StatNumber, { children: summaryLoading ? '…' : (summary?.pending ?? 0) }), _jsx(StatHelpText, { children: "Submissions awaiting processing" })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { children: "Average turnaround" }), _jsx(StatNumber, { children: summaryLoading
                                ? '…'
                                : summary?.turnaroundHours != null
                                    ? `${summary.turnaroundHours.toFixed(1)} h`
                                    : '—' }), _jsx(StatHelpText, { children: "From submission to final review" })] }) }) })] }));
const ReviewFiltersPanel = ({ filters, onFilterChange, onReset, onExport, exporting, loading, resultCount, totalCount, }) => {
    const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);
    return (_jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stack, { spacing: 4, children: [_jsxs(HStack, { justify: { base: 'flex-start', md: 'space-between' }, align: { base: 'flex-start', md: 'center' }, flexWrap: "wrap", gap: 4, children: [_jsx(Text, { fontSize: "sm", color: "gray.500", children: loading ? 'Loading reviews…' : `Showing ${resultCount} of ${totalCount} submissions` }), _jsxs(HStack, { spacing: 3, children: [_jsx(Button, { variant: "ghost", onClick: onReset, isDisabled: !hasActiveFilters, children: "Reset filters" }), _jsx(Button, { colorScheme: "brand", onClick: () => {
                                            void onExport();
                                        }, isLoading: exporting, children: "Export CSV" })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 3, lg: 5 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Language" }), _jsxs(Select, { value: filters.language ?? '', onChange: (event) => onFilterChange('language', event.target.value || undefined), children: [_jsx("option", { value: "", children: "All languages" }), LANGUAGE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Status" }), _jsxs(Select, { value: filters.status ?? '', onChange: (event) => onFilterChange('status', event.target.value || undefined), children: [_jsx("option", { value: "", children: "Any status" }), STATUS_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Minimum score" }), _jsxs(NumberInput, { value: filters.minScore ?? '', min: 0, max: 10, step: 0.5, precision: 1, onChange: (valueAsString, valueAsNumber) => onFilterChange('minScore', valueAsString === '' ? undefined : valueAsNumber), children: [_jsx(NumberInputField, { placeholder: "0-10" }), _jsxs(NumberInputStepper, { children: [_jsx(NumberIncrementStepper, {}), _jsx(NumberDecrementStepper, {})] })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "From date" }), _jsx(Input, { type: "date", value: filters.fromDate ?? '', max: filters.toDate, onChange: (event) => onFilterChange('fromDate', event.target.value || undefined) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "To date" }), _jsx(Input, { type: "date", value: filters.toDate ?? '', min: filters.fromDate, onChange: (event) => onFilterChange('toDate', event.target.value || undefined) })] })] })] }) }) }));
};
const AnalyticsCharts = ({ summaryLoading, summary }) => {
    if (summaryLoading) {
        return null;
    }
    const throughputData = summary?.throughput.daily ?? [];
    const issueData = summary?.commonIssues ?? [];
    const hasThroughput = throughputData.length > 0;
    const hasIssues = issueData.length > 0;
    return (_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 6, children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Heading, { size: "md", children: "Throughput (last 7 days)" }) }), _jsx(CardBody, { height: "250px", children: hasThroughput ? (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: throughputData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "count", stroke: "#3182ce", strokeWidth: 3 })] }) })) : (_jsx(Center, { height: "100%", children: _jsx(Text, { fontSize: "sm", color: "gray.500", textAlign: "center", children: "No submissions recorded in the last 7 days yet." }) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Heading, { size: "md", children: "Most frequent issue categories" }) }), _jsx(CardBody, { height: "250px", children: hasIssues ? (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: issueData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "category" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", fill: "#805AD5", radius: [6, 6, 0, 0] })] }) })) : (_jsx(Center, { height: "100%", children: _jsx(Text, { fontSize: "sm", color: "gray.500", textAlign: "center", children: "No recurring issues detected yet." }) })) })] })] }));
};
const RecentReviews = ({ loading, reviews, summary, page, pageSize, total, onPageChange, onPageSizeChange, }) => {
    const [expandedId, setExpandedId] = useState(null);
    const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const hasReviews = reviews.length > 0;
    const toggleRow = (submissionId) => {
        setExpandedId((current) => (current === submissionId ? null : submissionId));
    };
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(Heading, { size: "md", children: "Recent reviews" }), _jsx(Text, { fontSize: "sm", color: "gray.500", children: "Explore every submission that matches your filters, with summaries, issues, and AI diffs." }), summary && (_jsxs(HStack, { spacing: 3, mt: 3, flexWrap: "wrap", children: [_jsxs(Badge, { colorScheme: "green", variant: "subtle", children: ["Completed ", summary.completed] }), _jsxs(Badge, { colorScheme: "yellow", variant: "subtle", children: ["Pending ", summary.pending] }), _jsxs(Badge, { colorScheme: "red", variant: "subtle", children: ["Failed ", summary.failed] }), summary.avgScore != null && (_jsxs(Badge, { colorScheme: "purple", variant: "subtle", children: ["Avg score ", summary.avgScore.toFixed(2)] }))] }))] }), _jsxs(CardBody, { children: [loading && (_jsxs(HStack, { spacing: 3, color: "gray.500", children: [_jsx(Spinner, { size: "sm" }), _jsx(Text, { children: "Loading reviews\u2026" })] })), !loading && !hasReviews && (_jsx(Text, { fontSize: "sm", color: "gray.600", children: "No reviews found for the selected filters. Try adjusting language, status, or date range above." })), hasReviews && (_jsxs(Stack, { spacing: 5, children: [_jsx(Box, { overflowX: "auto", children: _jsxs(Table, { size: "sm", variant: "simple", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "ID" }), _jsx(Th, { children: "Language" }), _jsx(Th, { children: "Status" }), _jsx(Th, { children: "Score" }), _jsx(Th, { children: "Summary" }), _jsx(Th, { children: "Submitted" }), _jsx(Th, { children: "Completed" }), _jsx(Th, { children: "Source" }), _jsx(Th, { textAlign: "right", children: "Details" })] }) }), _jsx(Tbody, { children: reviews.map(({ submission, review }) => {
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
                                                const scoreDisplay = typeof review?.score === 'number' ? review.score.toFixed(2) : '—';
                                                const issues = review?.issues ?? [];
                                                const improvedCode = review?.improved_code ?? null;
                                                return (_jsxs(Fragment, { children: [_jsxs(Tr, { children: [_jsxs(Td, { fontFamily: "mono", children: ["#", shortId] }), _jsx(Td, { children: _jsx(Badge, { colorScheme: "blue", variant: "subtle", children: languageLabel }) }), _jsx(Td, { children: _jsx(Badge, { colorScheme: statusColor, children: status.toUpperCase() }) }), _jsx(Td, { children: scoreDisplay }), _jsx(Td, { maxW: "280px", children: _jsx(Text, { noOfLines: 2, children: summaryText }) }), _jsx(Td, { children: createdAt }), _jsx(Td, { children: completedAt }), _jsx(Td, { textTransform: "capitalize", children: submission.source ?? 'code' }), _jsx(Td, { textAlign: "right", children: _jsx(Button, { size: "sm", variant: "outline", onClick: () => toggleRow(submissionId), children: expandedId === submissionId ? 'Hide details' : 'View details' }) })] }), _jsx(Tr, { children: _jsx(Td, { colSpan: 9, border: "none", p: 0, bg: "transparent", children: _jsx(Collapse, { in: expandedId === submissionId, animateOpacity: true, children: _jsx(Box, { px: 4, py: 4, bg: "gray.50", children: _jsxs(Stack, { spacing: 3, fontSize: "sm", color: "gray.700", children: [_jsx(Text, { fontWeight: "semibold", children: "AI summary" }), _jsx(Text, { children: summaryText }), _jsx(Text, { fontWeight: "semibold", children: "Issues" }), issues.length ? (_jsx(Stack, { spacing: 1, children: issues.map((issue, index) => (_jsxs(Badge, { colorScheme: "orange", alignSelf: "flex-start", children: [issue.severity?.toUpperCase() ?? 'ISSUE', " \u00B7", ' ', issue.category, ":", ' ', issue.description ?? 'No description provided'] }, `${submissionId}-issue-${index}`))) })) : (_jsx(Text, { color: "gray.500", children: "No critical issues highlighted." })), improvedCode && (_jsxs(Stack, { spacing: 2, children: [_jsx(Text, { fontWeight: "semibold", children: "Suggested diff" }), _jsx(Suspense, { fallback: _jsx(Text, { fontSize: "sm", color: "gray.400", children: "Loading diff\u2026" }), children: _jsx(ReviewDiff, { original: submission.content, improved: improvedCode, language: submission.language }) })] }))] }) }) }) }) })] }, submissionId));
                                            }) })] }) }), _jsxs(HStack, { justify: "space-between", align: "center", flexWrap: "wrap", gap: 3, children: [_jsxs(HStack, { spacing: 3, children: [_jsx(Button, { size: "sm", onClick: () => onPageChange(page - 1), isDisabled: page <= 1, children: "Previous" }), _jsxs(Text, { fontSize: "sm", color: "gray.600", children: ["Page ", page, " of ", totalPages] }), _jsx(Button, { size: "sm", onClick: () => onPageChange(page + 1), isDisabled: page >= totalPages, children: "Next" })] }), _jsxs(HStack, { spacing: 2, align: "center", children: [_jsx(Text, { fontSize: "sm", color: "gray.500", children: "Rows per page" }), _jsx(Select, { size: "sm", width: "auto", value: pageSize, onChange: (event) => onPageSizeChange(Number(event.target.value)), children: [10, 20, 50].map((size) => (_jsx("option", { value: size, children: size }, size))) })] })] })] }))] })] }));
};
