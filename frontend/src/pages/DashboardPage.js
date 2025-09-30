import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Button, Card, CardBody, CardHeader, Divider, FormControl, FormLabel, Heading, HStack, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, SimpleGrid, Stack, Stat, StatHelpText, StatLabel, StatNumber, Text, useToast, } from '@chakra-ui/react';
import { Suspense, lazy, useMemo, useState } from 'react';
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
export const DashboardPage = () => {
    const toast = useToast();
    const [filters, setFilters] = useState({});
    const [isExporting, setIsExporting] = useState(false);
    const { data: reviewsData, isLoading: loadingReviews } = useListReviews(filters);
    const { data: summary, isLoading: loadingSummary } = useReviewSummary();
    const filteredCount = reviewsData?.filteredTotal ?? reviewsData?.items.length ?? 0;
    const totalCount = reviewsData?.total ?? filteredCount;
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
    return (_jsxs(Stack, { spacing: 8, children: [_jsx(AnalyticsHeader, { summaryLoading: loadingSummary, summary: summary }), _jsx(ReviewFiltersPanel, { filters: filters, onFilterChange: handleFilterChange, onReset: resetFilters, onExport: handleExport, exporting: isExporting, loading: loadingReviews, resultCount: filteredCount, totalCount: totalCount }), _jsx(AnalyticsCharts, { summaryLoading: loadingSummary, summary: summary }), _jsx(RecentReviews, { loading: loadingReviews, reviews: reviewsData?.items ?? [], summary: reviewsData?.summary })] }));
};
const AnalyticsHeader = ({ summaryLoading, summary }) => (_jsxs(SimpleGrid, { columns: { base: 1, md: 3 }, spacing: 6, children: [_jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { children: "Average score" }), _jsx(StatNumber, { children: summaryLoading ? '…' : summary?.avgScore != null ? summary.avgScore.toFixed(2) : '—' }), _jsx(StatHelpText, { children: "Across completed reviews" })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { children: "In queue" }), _jsx(StatNumber, { children: summaryLoading ? '…' : summary?.pending ?? 0 }), _jsx(StatHelpText, { children: "Submissions awaiting processing" })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { children: "Average turnaround" }), _jsx(StatNumber, { children: summaryLoading
                                ? '…'
                                : summary?.turnaroundHours
                                    ? `${summary.turnaroundHours.toFixed(1)} h`
                                    : '—' }), _jsx(StatHelpText, { children: "From submission to final review" })] }) }) })] }));
const ReviewFiltersPanel = ({ filters, onFilterChange, onReset, onExport, exporting, loading, resultCount, totalCount, }) => {
    const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);
    return (_jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stack, { spacing: 4, children: [_jsxs(HStack, { justify: { base: 'flex-start', md: 'space-between' }, align: { base: 'flex-start', md: 'center' }, flexWrap: "wrap", gap: 4, children: [_jsx(Text, { fontSize: "sm", color: "gray.500", children: loading
                                    ? 'Loading reviews…'
                                    : `Showing ${resultCount} of ${totalCount} submissions` }), _jsxs(HStack, { spacing: 3, children: [_jsx(Button, { variant: "ghost", onClick: onReset, isDisabled: !hasActiveFilters, children: "Reset filters" }), _jsx(Button, { colorScheme: "brand", onClick: () => {
                                            void onExport();
                                        }, isLoading: exporting, children: "Export CSV" })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 3, lg: 5 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Language" }), _jsxs(Select, { value: filters.language ?? '', onChange: (event) => onFilterChange('language', event.target.value || undefined), children: [_jsx("option", { value: "", children: "All languages" }), LANGUAGE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Status" }), _jsxs(Select, { value: filters.status ?? '', onChange: (event) => onFilterChange('status', event.target.value || undefined), children: [_jsx("option", { value: "", children: "Any status" }), STATUS_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Minimum score" }), _jsxs(NumberInput, { value: filters.minScore ?? '', min: 0, max: 10, step: 0.5, precision: 1, onChange: (valueAsString, valueAsNumber) => onFilterChange('minScore', valueAsString === '' ? undefined : valueAsNumber), children: [_jsx(NumberInputField, { placeholder: "0-10" }), _jsxs(NumberInputStepper, { children: [_jsx(NumberIncrementStepper, {}), _jsx(NumberDecrementStepper, {})] })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "From date" }), _jsx(Input, { type: "date", value: filters.fromDate ?? '', max: filters.toDate, onChange: (event) => onFilterChange('fromDate', event.target.value || undefined) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "To date" }), _jsx(Input, { type: "date", value: filters.toDate ?? '', min: filters.fromDate, onChange: (event) => onFilterChange('toDate', event.target.value || undefined) })] })] })] }) }) }));
};
const AnalyticsCharts = ({ summaryLoading, summary }) => {
    if (summaryLoading) {
        return null;
    }
    return (_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 6, children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Heading, { size: "md", children: "Throughput (last 7 days)" }) }), _jsx(CardBody, { height: "250px", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: summary?.throughput.daily ?? [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "count", stroke: "#3182ce", strokeWidth: 3 })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Heading, { size: "md", children: "Most frequent issue categories" }) }), _jsx(CardBody, { height: "250px", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: summary?.commonIssues ?? [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "category" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", fill: "#805AD5", radius: [6, 6, 0, 0] })] }) }) })] })] }));
};
const RecentReviews = ({ loading, reviews, summary }) => (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(Heading, { size: "md", children: "Recent reviews" }), _jsx(Text, { fontSize: "sm", color: "gray.500", children: "See the latest submissions and compare them with the suggested AI improvements." }), summary && (_jsxs(HStack, { spacing: 3, mt: 3, flexWrap: "wrap", children: [_jsxs(Badge, { colorScheme: "green", variant: "subtle", children: ["Completed ", summary.completed] }), _jsxs(Badge, { colorScheme: "yellow", variant: "subtle", children: ["Pending ", summary.pending] }), _jsxs(Badge, { colorScheme: "red", variant: "subtle", children: ["Failed ", summary.failed] }), summary.avgScore != null && (_jsxs(Badge, { colorScheme: "purple", variant: "subtle", children: ["Avg score ", summary.avgScore.toFixed(2)] }))] }))] }), _jsxs(CardBody, { children: [loading && _jsx(Text, { children: "Loading reviews\u2026" }), !loading && !reviews.length && _jsx(Text, { children: "No reviews found yet." }), _jsx(Stack, { spacing: 8, divider: _jsx(Divider, {}), children: reviews.map(({ submission, review }) => (_jsxs(Stack, { spacing: 3, children: [_jsxs(Heading, { size: "sm", children: [submission.language.toUpperCase(), " \u2022 #", submission.id.slice(-6)] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Status: ", submission.status] }), review?.summary && _jsx(Text, { children: review.summary }), review?.issues?.length ? (_jsx(Stack, { spacing: 2, children: review.issues.map((issue, index) => (_jsxs(Badge, { colorScheme: "orange", children: [issue.severity.toUpperCase(), " \u2022 ", issue.category, ": ", issue.description] }, `${submission.id}-issue-${index}`))) })) : (_jsx(Text, { fontSize: "sm", color: "gray.500", children: "No critical issues highlighted." })), _jsx(Suspense, { fallback: _jsx(Text, { fontSize: "sm", color: "gray.400", children: "Loading diff\u2026" }), children: _jsx(ReviewDiff, { original: submission.content, improved: review?.improved_code, language: submission.language }) })] }, submission.id))) })] })] }));
