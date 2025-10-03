import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, Code, Divider, HStack, Icon, List, ListItem, Spinner, Stack, Text, Tooltip, Wrap, WrapItem, } from '@chakra-ui/react';
import { MdCheckCircle, MdClose, MdLightbulb, MdOutlineSubtitles, MdSecurity, MdSpeed } from 'react-icons/md';
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
const severityToColorScheme = {
    critical: 'red',
    high: 'red',
    medium: 'orange',
    low: 'yellow',
    info: 'blue',
    suggestion: 'purple',
};
const formatTime = (iso) => {
    if (!iso) {
        return undefined;
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
const normaliseMetadataValue = (value) => {
    if (value == null) {
        return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    try {
        return JSON.stringify(value);
    }
    catch (error) {
        console.error('Unable to stringify metadata value', error);
        return '';
    }
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
    const submittedAt = formatTime(job.submittedAt);
    const completedAt = formatTime(job.completedAt);
    const providerLabel = job.provider ? job.provider.toUpperCase() : 'AI';
    const metadataEntries = Object.entries(job.metadata ?? {}).filter(([, value]) => value !== undefined && value !== null);
    const transcriptPreview = job.transcriptText?.trim();
    const confidenceLabel = job.transcriptConfidence != null
        ? `Confidence ${(job.transcriptConfidence * 100).toFixed(0)}%`
        : undefined;
    const removeJob = useReviewStore((state) => state.remove);
    return (_jsxs(Stack, { borderWidth: "1px", borderRadius: "lg", px: 4, py: 4, borderColor: "gray.200", bg: "white", boxShadow: "sm", spacing: 4, children: [_jsxs(HStack, { align: "flex-start", justify: "space-between", spacing: 6, children: [_jsxs(Stack, { spacing: 1, flex: 1, pr: 2, children: [_jsxs(Text, { fontWeight: "medium", children: ["Submission #", job.id.slice(-6)] }), _jsxs(HStack, { spacing: 2, flexWrap: "wrap", children: [_jsx(Badge, { colorScheme: "blue", variant: "subtle", children: languageLabel }), _jsx(Badge, { colorScheme: "teal", variant: "outline", children: sourceLabel }), job.cached && (_jsx(Tooltip, { label: "Result served from review cache", children: _jsx(Badge, { colorScheme: "purple", variant: "solid", children: "Cached hit" }) })), _jsxs(Badge, { colorScheme: "gray", variant: "subtle", children: ["Provider ", providerLabel] })] }), _jsxs(Text, { fontSize: "xs", color: "gray.400", children: [submittedAt ? `Submitted ${submittedAt}` : 'Submission queued', completedAt ? ` · Completed ${completedAt}` : ''] }), _jsx(Text, { fontSize: "sm", color: "gray.500", children: job.cached
                                    ? 'Served instantly from cache. You can still inspect the AI output below.'
                                    : isFinalState
                                        ? 'Review ready — explore the AI summary, issues, and suggestions.'
                                        : 'Awaiting AI response. Keep this tab open to watch progress in real time.' }), metadataEntries.length > 0 && (_jsx(Wrap, { spacing: 2, pt: 1, children: metadataEntries.map(([key, value]) => {
                                    const rendered = normaliseMetadataValue(value);
                                    if (!rendered) {
                                        return null;
                                    }
                                    return (_jsx(WrapItem, { children: _jsxs(Badge, { variant: "outline", colorScheme: "purple", children: [key, ": ", rendered] }) }, `${job.id}-${key}`));
                                }) }))] }), _jsxs(Stack, { spacing: 2, align: "flex-end", minW: "120px", children: [job.status === 'processing' && _jsx(Spinner, { size: "sm" }), _jsx(Badge, { colorScheme: color, children: label }), typeof job.score === 'number' && (_jsx(Tooltip, { label: "AI quality score (0-10)", children: _jsxs(Box, { fontSize: "sm", fontWeight: "semibold", color: "gray.600", children: ["Score ", job.score.toFixed(1)] }) })), isFinalState && (_jsx(Button, { size: "xs", variant: "ghost", colorScheme: "gray", leftIcon: _jsx(Icon, { as: MdClose }), onClick: () => removeJob(job.id), children: "Dismiss" }))] })] }), isFinalState && (_jsxs(Stack, { spacing: 4, fontSize: "sm", color: "gray.700", children: [job.summary && _jsx(Text, { children: job.summary }), job.issues?.length ? (_jsx(Stack, { spacing: 3, children: job.issues.map((issue, index) => {
                            const severityKey = issue.severity?.toLowerCase() ?? 'suggestion';
                            const badgeColor = severityToColorScheme[severityKey] ?? 'orange';
                            return (_jsxs(Box, { borderWidth: "1px", borderRadius: "md", borderColor: "gray.100", p: 3, bg: "gray.50", children: [_jsxs(HStack, { spacing: 2, align: "center", mb: 1, children: [_jsx(Badge, { colorScheme: badgeColor, children: issue.severity?.toUpperCase() ?? 'ISSUE' }), _jsx(Text, { fontWeight: "semibold", children: issue.category })] }), issue.description && (_jsx(Text, { color: "gray.700", mb: 1, children: issue.description })), issue.recommendation && (_jsxs(Text, { color: "gray.600", children: ["Recommendation: ", issue.recommendation] }))] }, `${job.id}-issue-${index}`));
                        }) })) : (_jsx(Text, { color: "gray.500", children: "No critical issues reported." })), (job.securityConcerns?.length ?? 0) > 0 && (_jsxs(Box, { children: [_jsxs(HStack, { spacing: 2, mb: 1, children: [_jsx(Icon, { as: MdSecurity, color: "red.500" }), _jsx(Text, { fontWeight: "semibold", children: "Security concerns" })] }), _jsx(List, { spacing: 1, pl: 4, styleType: "disc", color: "gray.600", children: job.securityConcerns?.map((item, idx) => (_jsx(ListItem, { children: item }, `${job.id}-security-${idx}`))) })] })), (job.performanceRecommendations?.length ?? 0) > 0 && (_jsxs(Box, { children: [_jsxs(HStack, { spacing: 2, mb: 1, children: [_jsx(Icon, { as: MdSpeed, color: "orange.500" }), _jsx(Text, { fontWeight: "semibold", children: "Performance recommendations" })] }), _jsx(List, { spacing: 1, pl: 4, styleType: "disc", color: "gray.600", children: job.performanceRecommendations?.map((item, idx) => (_jsx(ListItem, { children: item }, `${job.id}-perf-${idx}`))) })] })), (job.additionalSuggestions?.length ?? 0) > 0 && (_jsxs(Box, { children: [_jsxs(HStack, { spacing: 2, mb: 1, children: [_jsx(Icon, { as: MdLightbulb, color: "yellow.500" }), _jsx(Text, { fontWeight: "semibold", children: "Additional suggestions" })] }), _jsx(List, { spacing: 1, pl: 4, styleType: "disc", color: "gray.600", children: job.additionalSuggestions?.map((item, idx) => (_jsx(ListItem, { children: item }, `${job.id}-suggestion-${idx}`))) })] })), transcriptPreview && (_jsxs(Box, { borderWidth: "1px", borderRadius: "md", borderColor: "gray.100", p: 3, bg: "gray.50", children: [_jsxs(HStack, { spacing: 2, mb: 1, color: "gray.600", children: [_jsx(Icon, { as: MdOutlineSubtitles }), _jsx(Text, { fontWeight: "semibold", children: "Transcript" }), confidenceLabel && _jsx(Badge, { colorScheme: "green", children: confidenceLabel })] }), _jsx(Text, { color: "gray.600", children: transcriptPreview })] })), job.improvedCode && (_jsxs(Box, { bg: "gray.900", borderRadius: "md", p: 3, borderWidth: "1px", borderColor: "gray.800", children: [_jsxs(HStack, { spacing: 2, mb: 2, color: "gray.100", children: [_jsx(Icon, { as: MdCheckCircle }), _jsx(Text, { fontWeight: "semibold", children: "Suggested snippet" })] }), _jsxs(Code, { whiteSpace: "pre", display: "block", overflowX: "auto", fontSize: "xs", bg: "transparent", color: "green.200", children: [job.improvedCode.slice(0, 1200), job.improvedCode.length > 1200 ? '…' : ''] })] }))] })), isFinalState && _jsx(Divider, { borderColor: "gray.100" })] }));
};
