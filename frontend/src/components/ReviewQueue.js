import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, HStack, Spinner, Stack, Text } from '@chakra-ui/react';
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
    return (_jsxs(HStack, { justify: "space-between", borderWidth: "1px", borderRadius: "lg", px: 4, py: 3, borderColor: "gray.200", bg: "white", boxShadow: "sm", children: [_jsxs(Stack, { spacing: 0, children: [_jsxs(Text, { fontWeight: "medium", children: ["Submission #", job.id.slice(-6)] }), _jsx(Text, { fontSize: "sm", color: "gray.500", children: job.cached ? 'Served from cache' : 'Awaiting AI response' })] }), _jsxs(HStack, { spacing: 2, children: [job.status === 'processing' && _jsx(Spinner, { size: "sm" }), _jsx(Badge, { colorScheme: color, children: label }), typeof job.score === 'number' && (_jsxs(Box, { fontSize: "sm", fontWeight: "semibold", color: "gray.600", children: ["Score ", job.score.toFixed(1)] }))] })] }));
};
