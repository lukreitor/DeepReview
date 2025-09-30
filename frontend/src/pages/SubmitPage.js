import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert, AlertDescription, AlertIcon, Badge, Box, Button, ButtonGroup, Container, Flex, FormControl, FormHelperText, FormLabel, Heading, HStack, Icon, Input, Select, SimpleGrid, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useToast, } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, lazy, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdCheckCircle, MdMic } from 'react-icons/md';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
import { useCreateReview } from '@features/reviews/api';
import { ReviewQueue } from '@components/ReviewQueue';
import { useAuthStore } from '@store/authStore';
import { getApiErrorMessage } from '@services/api';
const codeSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    content: z.string().min(10, 'Provide at least 10 characters of code'),
});
export const SubmitPage = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const isAuthenticated = Boolean(token);
    const demoEmail = import.meta.env.VITE_DEMO_USER_EMAIL ?? 'demo@deepreview.dev';
    const demoPassword = import.meta.env.VITE_DEMO_USER_PASSWORD ?? 'DeepReview!123';
    const [mode, setMode] = useState('code');
    const [audioBase64, setAudioBase64] = useState(null);
    const fileInputRef = useRef(null);
    const mutation = useCreateReview();
    const { control, register, handleSubmit, formState: { errors }, reset, watch, } = useForm({
        resolver: zodResolver(codeSchema),
        defaultValues: {
            language: 'python',
            content: "def handler(event):\n    return 'Hello from DeepReview'",
        },
    });
    const watchedLanguage = watch('language');
    const contentError = errors.content?.message;
    const handleAudioSelection = (files) => {
        const file = files?.[0];
        if (!file) {
            setAudioBase64(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                setAudioBase64(result);
            }
        };
        reader.readAsDataURL(file);
    };
    const promptLogin = () => {
        toast({
            title: 'Sign in required',
            description: 'Log in to submit items for review and receive updates.',
            status: 'warning',
        });
        navigate('/login');
    };
    const submitCode = (values) => {
        if (!isAuthenticated) {
            promptLogin();
            return;
        }
        mutation.mutate({
            language: values.language,
            content: values.content,
            source: 'code',
            metadata: { submittedVia: 'web', mode: 'code' },
        }, {
            onSuccess: () => {
                toast({
                    title: 'Submission sent',
                    description: 'You will receive real-time updates.',
                    status: 'success',
                });
                reset();
            },
            onError: (error) => {
                toast({
                    title: 'Submission failed',
                    description: getApiErrorMessage(error, 'Check the details and try again.'),
                    status: 'error',
                });
            },
        });
    };
    const submitAudio = () => {
        if (!isAuthenticated) {
            promptLogin();
            return;
        }
        if (!audioBase64) {
            toast({
                title: 'Select an audio file first',
                status: 'warning',
            });
            return;
        }
        mutation.mutate({
            source: 'audio',
            audio_base64: audioBase64,
            language: watchedLanguage,
            metadata: { submittedVia: 'web', mode: 'audio' },
        }, {
            onSuccess: () => {
                toast({
                    title: 'Audio uploaded',
                    description: 'We will transcribe and review your code.',
                    status: 'success',
                });
                setAudioBase64(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
            onError: (error) => {
                toast({
                    title: 'Audio submission failed',
                    description: getApiErrorMessage(error, 'Try again or contact the support team.'),
                    status: 'error',
                });
            },
        });
    };
    const handleCodeSubmit = handleSubmit((values) => {
        submitCode(values);
    });
    return (_jsx(Flex, { minH: "100vh", bgGradient: "linear(to-br, gray.50, white)", align: "flex-start", children: _jsxs(Container, { maxW: "6xl", py: { base: 12, md: 16 }, children: [_jsxs(SimpleGrid, { columns: { base: 1, lg: 2 }, spacing: { base: 10, lg: 16 }, alignItems: "start", children: [_jsxs(Stack, { spacing: 8, pr: { lg: 12 }, children: [_jsx(Badge, { colorScheme: "brand", alignSelf: "flex-start", borderRadius: "full", px: 3, py: 1, children: "Unified review workflow" }), _jsx(Heading, { size: "lg", children: "Submit code or audio and get AI feedback instantly" }), _jsx(Text, { color: "gray.600", children: "DeepReview normalizes your submissions, queues them for analysis, and shares results with your entire team in real time." }), _jsx(Stack, { spacing: 3, color: "gray.700", children: [
                                        'Support for multiple languages and audio-to-code transcription.',
                                        'Real-time queue updates and analytics insights.',
                                        'Demo workspace available to explore without creating an account.',
                                    ].map((item) => (_jsxs(Stack, { direction: "row", align: "center", spacing: 3, children: [_jsx(Icon, { as: MdCheckCircle, color: "brand.500", boxSize: 5 }), _jsx(Text, { children: item })] }, item))) }), _jsxs(Alert, { status: "info", variant: "subtle", borderRadius: "lg", children: [_jsx(AlertIcon, {}), _jsxs(Stack, { spacing: 0, fontSize: "sm", color: "gray.700", children: [_jsx(Text, { children: "Demo credentials for quick access:" }), _jsxs(Text, { children: [_jsx(Badge, { mr: 2, colorScheme: "brand", children: "Email" }), demoEmail] }), _jsxs(Text, { children: [_jsx(Badge, { mr: 2, colorScheme: "brand", children: "Password" }), demoPassword] })] })] }), !isAuthenticated && (_jsxs(ButtonGroup, { size: "sm", children: [_jsx(Button, { colorScheme: "brand", onClick: () => navigate('/login'), children: "Go to login" }), _jsx(Button, { variant: "outline", onClick: () => navigate('/register'), children: "Create an account" })] }))] }), _jsx(Box, { bg: "white", borderRadius: "2xl", boxShadow: "2xl", p: { base: 6, md: 8 }, children: _jsxs(Stack, { spacing: 6, children: [_jsxs(Stack, { spacing: 1, children: [_jsx(Heading, { size: "md", children: "Submit for review" }), _jsx(Text, { color: "gray.500", children: "Choose the best format for your team\u2014code snippets or voice notes." })] }), !isAuthenticated && (_jsxs(Alert, { status: "info", variant: "left-accent", borderRadius: "lg", children: [_jsx(AlertIcon, {}), _jsx(AlertDescription, { children: "Sign in to keep a history of submissions and receive live updates." })] })), _jsxs(Tabs, { index: mode === 'code' ? 0 : 1, onChange: (index) => setMode(index === 0 ? 'code' : 'audio'), variant: "enclosed", colorScheme: "brand", children: [_jsxs(TabList, { bg: "gray.50", borderRadius: "xl", p: 2, children: [_jsx(Tab, { borderRadius: "lg", children: "Code editor" }), _jsxs(Tab, { display: "flex", gap: 2, alignItems: "center", borderRadius: "lg", children: [_jsx(Icon, { as: MdMic }), " Audio (Whisper)"] })] }), _jsxs(TabPanels, { mt: 4, children: [_jsx(TabPanel, { px: 0, children: _jsxs(Stack, { as: "form", spacing: 6, onSubmit: (event) => void handleCodeSubmit(event), children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Language" }), _jsxs(Select, { ...register('language'), children: [_jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "typescript", children: "TypeScript" }), _jsx("option", { value: "go", children: "Go" }), _jsx("option", { value: "java", children: "Java" })] })] }), _jsxs(FormControl, { isInvalid: Boolean(contentError), children: [_jsx(FormLabel, { children: "Snippet" }), _jsx(Box, { borderWidth: "1px", borderRadius: "lg", overflow: "hidden", boxShadow: "sm", children: _jsx(Controller, { name: "content", control: control, render: ({ field, }) => (_jsx(Suspense, { fallback: _jsx(Flex, { height: "400px", align: "center", justify: "center", bg: "gray.100", children: _jsx(Spinner, { color: "brand.500", thickness: "4px" }) }), children: _jsx(MonacoEditor, { height: "400px", language: watchedLanguage || 'python', theme: "vs-light", value: field.value, onChange: (value) => field.onChange(value ?? ''), options: {
                                                                                            minimap: { enabled: false },
                                                                                            fontSize: 14,
                                                                                            wordWrap: 'on',
                                                                                        } }) })) }) }), contentError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 2, children: contentError }))] }), _jsx(HStack, { justify: "flex-end", children: _jsx(Button, { type: "submit", isLoading: mutation.isPending, isDisabled: !isAuthenticated, colorScheme: "brand", children: "Submit for review" }) })] }) }), _jsx(TabPanel, { px: 0, children: _jsxs(Stack, { spacing: 5, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Expected language" }), _jsxs(Select, { ...register('language'), children: [_jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "typescript", children: "TypeScript" }), _jsx("option", { value: "go", children: "Go" }), _jsx("option", { value: "java", children: "Java" })] }), _jsx(FormHelperText, { children: "We use this field to prime the AI prompt, but transcription will still try to identify the correct language automatically." })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Audio file" }), _jsx(Input, { ref: fileInputRef, type: "file", accept: "audio/*", onChange: (event) => handleAudioSelection(event.target.files) }), _jsx(FormHelperText, { children: "The audio should describe the code you want to generate. Files up to 25MB are supported." }), audioBase64 && (_jsxs(Text, { fontSize: "sm", color: "green.500", mt: 1, children: ["File prepared (", Math.round((audioBase64.length * 3) / 4 / 1024), " KB)"] }))] }), _jsx(HStack, { justify: "flex-end", children: _jsx(Button, { variant: "solid", colorScheme: "accent", onClick: submitAudio, isLoading: mutation.isPending, isDisabled: !isAuthenticated, children: "Transcribe and review" }) })] }) })] })] })] }) })] }), _jsxs(Box, { mt: { base: 12, md: 16 }, children: [_jsx(Heading, { size: "md", mb: 2, children: "Live review queue" }), _jsx(Text, { color: "gray.600", children: "Track statuses, scores, and AI insights as soon as they are ready." }), _jsx(Box, { mt: 6, children: _jsx(ReviewQueue, {}) })] })] }) }));
};
