import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, Center, FormControl, FormHelperText, FormLabel, HStack, Icon, Input, Select, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useToast, } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, lazy, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdMic } from 'react-icons/md';
import { z } from 'zod';
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
import { useCreateReview } from '@features/reviews/api';
import { ReviewQueue } from '@components/ReviewQueue';
const codeSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    content: z.string().min(10, 'Provide at least 10 characters of code'),
});
export const SubmitPage = () => {
    const toast = useToast();
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
    const submitCode = (values) => {
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
            onError: () => {
                toast({
                    title: 'Submission failed',
                    description: 'Check the details and try again.',
                    status: 'error',
                });
            },
        });
    };
    const submitAudio = () => {
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
            onError: () => {
                toast({
                    title: 'Audio submission failed',
                    description: 'Try again or contact the support team.',
                    status: 'error',
                });
            },
        });
    };
    const handleCodeSubmit = handleSubmit((values) => {
        submitCode(values);
    });
    return (_jsxs(Stack, { spacing: 10, children: [_jsxs(Stack, { spacing: 2, children: [_jsx(Text, { fontSize: "lg", fontWeight: "semibold", color: "brand.600", children: "Submit for review" }), _jsx(Text, { color: "gray.600", children: "Choose between code or audio instructions\u2014the AI will normalize, review, and keep your team in sync." })] }), _jsx(Box, { children: _jsxs(Tabs, { index: mode === 'code' ? 0 : 1, onChange: (index) => setMode(index === 0 ? 'code' : 'audio'), isFitted: true, variant: "enclosed", colorScheme: "brand", children: [_jsxs(TabList, { bg: "gray.50", borderRadius: "xl", p: 2, children: [_jsx(Tab, { borderRadius: "lg", children: "Code editor" }), _jsxs(Tab, { display: "flex", gap: 2, alignItems: "center", borderRadius: "lg", children: [_jsx(Icon, { as: MdMic }), " Audio (Whisper)"] })] }), _jsxs(TabPanels, { mt: 4, children: [_jsx(TabPanel, { px: 0, children: _jsx(Box, { bg: "gray.50", borderRadius: "2xl", p: { base: 4, md: 6 }, boxShadow: "sm", children: _jsxs(Stack, { as: "form", spacing: 6, onSubmit: (event) => void handleCodeSubmit(event), children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Language" }), _jsxs(Select, { ...register('language'), children: [_jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "typescript", children: "TypeScript" }), _jsx("option", { value: "go", children: "Go" }), _jsx("option", { value: "java", children: "Java" })] })] }), _jsxs(FormControl, { isInvalid: Boolean(contentError), children: [_jsx(FormLabel, { children: "Snippet" }), _jsx(Box, { borderWidth: "1px", borderRadius: "lg", overflow: "hidden", boxShadow: "sm", children: _jsx(Controller, { name: "content", control: control, render: ({ field, }) => (_jsx(Suspense, { fallback: _jsx(Center, { height: "400px", bg: "gray.100", children: _jsx(Spinner, { color: "brand.500", thickness: "4px" }) }), children: _jsx(MonacoEditor, { height: "400px", language: watchedLanguage || 'python', theme: "vs-light", value: field.value, onChange: (value) => field.onChange(value ?? ''), options: {
                                                                            minimap: { enabled: false },
                                                                            fontSize: 14,
                                                                            wordWrap: 'on',
                                                                        } }) })) }) }), contentError && (_jsx(Badge, { colorScheme: "red", mt: 2, alignSelf: "flex-start", children: contentError }))] }), _jsx(HStack, { justify: "flex-end", children: _jsx(Button, { type: "submit", isLoading: mutation.isPending, children: "Submit for review" }) })] }) }) }), _jsx(TabPanel, { px: 0, children: _jsx(Box, { bg: "gray.50", borderRadius: "2xl", p: { base: 4, md: 6 }, boxShadow: "sm", children: _jsxs(Stack, { spacing: 5, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Expected language" }), _jsxs(Select, { ...register('language'), children: [_jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "typescript", children: "TypeScript" }), _jsx("option", { value: "go", children: "Go" }), _jsx("option", { value: "java", children: "Java" })] }), _jsx(FormHelperText, { children: "We use this field to prime the AI prompt, but transcription will still try to identify the correct language automatically." })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Audio file" }), _jsx(Input, { ref: fileInputRef, type: "file", accept: "audio/*", onChange: (event) => handleAudioSelection(event.target.files) }), _jsx(FormHelperText, { children: "The audio should describe the code you want to generate. Files up to 25MB are supported." }), audioBase64 && (_jsxs(Text, { fontSize: "sm", color: "green.500", mt: 1, children: ["File prepared (", Math.round((audioBase64.length * 3) / 4 / 1024), " KB)"] }))] }), _jsx(HStack, { justify: "flex-end", children: _jsx(Button, { variant: "solid", colorScheme: "accent", onClick: submitAudio, isLoading: mutation.isPending, children: "Transcribe and review" }) })] }) }) })] })] }) }), _jsx(ReviewQueue, {})] }));
};
