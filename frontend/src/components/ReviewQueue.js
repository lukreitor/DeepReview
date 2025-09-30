import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Code, HStack, Spinner, Stack, Text } from '@chakra-ui/react';
import { useReviewStore } from '@store/reviewStore';
const statusToColor = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    cached: 'green',
    failed: 'red',
};
const statusToLabel = {
    pending: 'Queued',
    processing: 'Processing',
    completed: 'Completed',
    cached: 'Cached',
    failed: 'Failed',
};
export const ReviewQueue = () => {
    const jobs = useReviewStore((state) => state.jobs);
    if (!jobs.length) {
        return null;
    }
    return (_jsx(Box, { bg: "gray.50", borderRadius: "2xl", px: { base: 4, md: 6 }, py: { base: 5, md: 6 }, borderWidth: "1px", borderColor: "gray.100", boxShadow: "md", children: _jsxs(Stack, { spacing: 3, children: [_jsx(Text, { fontWeight: "semibold", color: "gray.700", children: "Live queue" }), _jsx(Stack, { spacing: 3, children: jobs.map((job) => (_jsx(QueueItem, { job: job }, job.id))) })] }) }));
};
const QueueItem = ({ job }) => {
    const color = statusToColor[job.status] ?? 'gray';
    const label = statusToLabel[job.status] ?? job.status;
    const isFinalState = ['completed', 'cached', 'failed'].includes(job.status);
    const languageLabel = job.language ? job.language.toUpperCase() : 'UNKNOWN';
    const sourceLabel = job.source === 'audio' ? 'Audio' : 'Code';
    const submittedAt = job.submittedAt ? new Date(job.submittedAt).toLocaleTimeString() : undefined;
    const completedAt = job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : undefined;
    return (_jsxs(HStack, { justify: "space-between", borderWidth: "1px", borderRadius: "lg", px: 4, py: 3, borderColor: "gray.200", bg: "white", boxShadow: "sm", alignItems: "flex-start", children: [_jsxs(Stack, { spacing: 2, flex: 1, pr: 4, children: [_jsxs(Stack, { spacing: 0, children: [_jsxs(Text, { fontWeight: "medium", children: ["Submission #", job.id.slice(-6)] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: [languageLabel, " \u00B7 ", sourceLabel] }), _jsxs(Text, { fontSize: "xs", color: "gray.400", children: [submittedAt ? `Submitted ${submittedAt}` : 'Submission queued', completedAt ? ` · Completed ${completedAt}` : ''] }), _jsx(Text, { fontSize: "sm", color: "gray.500", children: job.cached
                                    ? 'Served from cache'
                                    : isFinalState
                                        ? 'Review ready'
                                        : 'Awaiting AI response' })] }), isFinalState && (_jsxs(Stack, { spacing: 2, fontSize: "sm", color: "gray.600", children: [job.summary && _jsx(Text, { children: job.summary }), job.issues?.length ? (_jsx(Stack, { spacing: 1, children: job.issues.map((issue, index) => (_jsxs(Badge, { colorScheme: "orange", alignSelf: "flex-start", children: [issue.severity?.toUpperCase() ?? 'ISSUE', " \u00B7 ", issue.category, ":", ' ', issue.description] }, `${job.id}-issue-${index}`))) })) : (_jsx(Text, { color: "gray.500", children: "No critical issues reported." })), job.improvedCode && (_jsxs(Box, { bg: "gray.50", borderRadius: "md", p: 3, borderWidth: "1px", borderColor: "gray.100", children: [_jsx(Text, { fontSize: "xs", color: "gray.500", mb: 1, children: "Suggested snippet" }), _jsxs(Code, { whiteSpace: "pre", display: "block", overflowX: "auto", children: [job.improvedCode.slice(0, 600), job.improvedCode.length > 600 ? '…' : ''] })] }))] }))] }), _jsxs(HStack, { spacing: 2, children: [job.status === 'processing' && _jsx(Spinner, { size: "sm" }), _jsx(Badge, { colorScheme: color, children: label }), typeof job.score === 'number' && (_jsxs(Box, { fontSize: "sm", fontWeight: "semibold", color: "gray.600", children: ["Score ", job.score.toFixed(1)] }))] })] }));
};
