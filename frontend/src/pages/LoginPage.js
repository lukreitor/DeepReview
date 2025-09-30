import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert, AlertIcon, Badge, Box, Button, ButtonGroup, Container, Flex, FormControl, FormLabel, Heading, Icon, Input, Link, SimpleGrid, Stack, Text, useToast, } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MdCheckCircle } from 'react-icons/md';
import { useLogin } from '@features/auth/api';
import { useAuthStore } from '@store/authStore';
import { getApiErrorMessage } from '@services/api';
const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password is required'),
});
export const LoginPage = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const mutation = useLogin();
    const [serverError, setServerError] = useState(null);
    const demoEmail = import.meta.env.VITE_DEMO_USER_EMAIL ?? 'demo@deepreview.dev';
    const demoPassword = import.meta.env.VITE_DEMO_USER_PASSWORD ?? 'DeepReview!123';
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            email: '',
            password: '',
        },
    });
    const emailError = errors.email?.message;
    const passwordError = errors.password?.message;
    useEffect(() => {
        if (token) {
            navigate('/dashboard', { replace: true });
        }
    }, [token, navigate]);
    const submitHandler = handleSubmit((values) => {
        setServerError(null);
        mutation.mutate(values, {
            onSuccess: (data) => {
                setToken(data.access_token);
                toast({ title: 'Welcome back!', status: 'success' });
                navigate('/dashboard', { replace: true });
            },
            onError: (error) => {
                const message = getApiErrorMessage(error, 'Check your credentials and try again.');
                setServerError(message);
                toast({
                    title: 'Login failed',
                    description: message,
                    status: 'error',
                });
            },
        });
    });
    return (_jsx(Flex, { minH: "100vh", bgGradient: "linear(to-br, gray.50, white)", align: "center", children: _jsx(Container, { maxW: "6xl", py: { base: 12, md: 16 }, children: _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: { base: 10, md: 14 }, alignItems: "center", children: [_jsxs(Stack, { spacing: 8, pr: { md: 12 }, children: [_jsx(Badge, { colorScheme: "brand", alignSelf: "flex-start", borderRadius: "full", px: 3, py: 1, children: "AI-powered reviews" }), _jsx(Heading, { size: "lg", children: "Instant feedback for every code submission" }), _jsx(Text, { color: "gray.600", children: "Stay in the loop with actionable AI review insights, faster turnarounds, and a shared queue for your team." }), _jsxs(Stack, { spacing: 3, color: "gray.700", children: [_jsxs(Stack, { direction: "row", align: "center", spacing: 3, children: [_jsx(Icon, { as: MdCheckCircle, color: "brand.500", boxSize: 5 }), _jsx(Text, { children: "Single dashboard for submissions and analytics." })] }), _jsxs(Stack, { direction: "row", align: "center", spacing: 3, children: [_jsx(Icon, { as: MdCheckCircle, color: "brand.500", boxSize: 5 }), _jsx(Text, { children: "Zero-config queue with real-time updates." })] }), _jsxs(Stack, { direction: "row", align: "center", spacing: 3, children: [_jsx(Icon, { as: MdCheckCircle, color: "brand.500", boxSize: 5 }), _jsx(Text, { children: "Works across languages, audio transcripts, and more." })] })] }), _jsxs(ButtonGroup, { size: "sm", children: [_jsx(Button, { as: RouterLink, to: "/register", colorScheme: "brand", variant: "outline", children: "Create account" }), _jsx(Button, { as: RouterLink, to: "/submit", variant: "ghost", colorScheme: "brand", children: "Explore submissions" })] })] }), _jsx(Box, { bg: "white", borderRadius: "2xl", boxShadow: "2xl", p: { base: 6, md: 8 }, children: _jsxs(Stack, { spacing: 6, children: [_jsxs(Stack, { spacing: 1, children: [_jsx(Heading, { size: "md", children: "Sign in to DeepReview" }), _jsx(Text, { color: "gray.500", children: "Access your workspace and pick up where you left off." })] }), serverError && (_jsxs(Alert, { status: "error", borderRadius: "lg", children: [_jsx(AlertIcon, {}), serverError] })), _jsxs(Stack, { as: "form", spacing: 5, onSubmit: (event) => void submitHandler(event), children: [_jsxs(FormControl, { isInvalid: Boolean(emailError), children: [_jsx(FormLabel, { children: "Email" }), _jsx(Input, { type: "email", ...register('email'), autoComplete: "email" }), emailError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: emailError }))] }), _jsxs(FormControl, { isInvalid: Boolean(passwordError), children: [_jsx(FormLabel, { children: "Password" }), _jsx(Input, { type: "password", ...register('password'), autoComplete: "current-password" }), passwordError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: passwordError }))] }), _jsx(Button, { colorScheme: "brand", type: "submit", isLoading: mutation.isPending, children: "Sign in" })] }), _jsxs(Alert, { status: "info", borderRadius: "lg", variant: "subtle", children: [_jsx(AlertIcon, {}), _jsxs(Stack, { spacing: 0, fontSize: "sm", color: "gray.700", children: [_jsx(Text, { children: "Use the demo account to explore without registering:" }), _jsxs(Text, { children: [_jsx(Badge, { mr: 2, colorScheme: "brand", children: "Email" }), demoEmail] }), _jsxs(Text, { children: [_jsx(Badge, { mr: 2, colorScheme: "brand", children: "Password" }), demoPassword] })] })] }), _jsxs(Text, { fontSize: "sm", color: "gray.600", textAlign: "center", children: ["No account yet?", ' ', _jsx(Link, { as: RouterLink, to: "/register", color: "brand.500", fontWeight: "semibold", children: "Create one now" })] })] }) })] }) }) }));
};
