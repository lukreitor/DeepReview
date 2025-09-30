import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert, AlertIcon, Badge, Box, Button, ButtonGroup, Container, Flex, FormControl, FormHelperText, FormLabel, Heading, Icon, Input, Link, SimpleGrid, Stack, Text, useToast, } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MdCheckCircle } from 'react-icons/md';
import { useRegister } from '@features/auth/api';
import { useAuthStore } from '@store/authStore';
import { getApiErrorMessage } from '@services/api';
const baseSchema = z.object({
    full_name: z.string().min(3, 'Full name must be at least 3 characters').optional(),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
});
const schema = baseSchema.refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
});
export const RegisterPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const mutation = useRegister();
    const [serverError, setServerError] = useState(null);
    const demoEmail = import.meta.env.VITE_DEMO_USER_EMAIL ?? 'demo@deepreview.dev';
    const demoPassword = import.meta.env.VITE_DEMO_USER_PASSWORD ?? 'DeepReview!123';
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });
    const emailError = errors.email?.message;
    const passwordError = errors.password?.message;
    const confirmPasswordError = errors.confirmPassword?.message;
    useEffect(() => {
        if (token) {
            navigate('/dashboard', { replace: true });
        }
    }, [token, navigate]);
    const submitHandler = handleSubmit((values) => {
        setServerError(null);
        mutation.mutate({ email: values.email, password: values.password, full_name: values.full_name }, {
            onSuccess: (data) => {
                setToken(data.access_token);
                toast({ title: 'Account created', status: 'success' });
                navigate('/dashboard', { replace: true });
            },
            onError: (error) => {
                const message = getApiErrorMessage(error, 'Try a different email or adjust your password.');
                setServerError(message);
                toast({
                    title: 'Registration failed',
                    description: message,
                    status: 'error',
                });
            },
        });
    });
    return (_jsx(Flex, { minH: "100vh", bgGradient: "linear(to-br, gray.50, white)", align: "center", children: _jsx(Container, { maxW: "6xl", py: { base: 12, md: 16 }, children: _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: { base: 10, md: 14 }, alignItems: "center", children: [_jsxs(Stack, { spacing: 8, pr: { md: 12 }, children: [_jsx(Badge, { colorScheme: "accent", alignSelf: "flex-start", borderRadius: "full", px: 3, py: 1, children: "Get started fast" }), _jsx(Heading, { size: "lg", children: "Create your DeepReview workspace in minutes" }), _jsx(Text, { color: "gray.600", children: "Collaborate with AI-reinforced reviewers, track quality trends, and keep code health transparent across your team." }), _jsxs(Stack, { spacing: 3, color: "gray.700", children: [_jsxs(Stack, { direction: "row", align: "center", spacing: 3, children: [_jsx(Icon, { as: MdCheckCircle, color: "accent.500", boxSize: 5 }), _jsx(Text, { children: "Unlimited submissions during preview." })] }), _jsxs(Stack, { direction: "row", align: "center", spacing: 3, children: [_jsx(Icon, { as: MdCheckCircle, color: "accent.500", boxSize: 5 }), _jsx(Text, { children: "Detailed analytics to surface regressions quickly." })] }), _jsxs(Stack, { direction: "row", align: "center", spacing: 3, children: [_jsx(Icon, { as: MdCheckCircle, color: "accent.500", boxSize: 5 }), _jsx(Text, { children: "Invite teammates to share review queues." })] })] }), _jsxs(ButtonGroup, { size: "sm", children: [_jsx(Button, { as: RouterLink, to: "/login", variant: "outline", colorScheme: "accent", children: "Already have an account?" }), _jsx(Button, { as: RouterLink, to: "/submit", variant: "ghost", colorScheme: "accent", children: "Preview the workflow" })] })] }), _jsx(Box, { bg: "white", borderRadius: "2xl", boxShadow: "2xl", p: { base: 6, md: 8 }, children: _jsxs(Stack, { spacing: 6, children: [_jsxs(Stack, { spacing: 1, children: [_jsx(Heading, { size: "md", children: "Join DeepReview" }), _jsx(Text, { color: "gray.500", children: "Create an account to unlock AI-powered reviews." })] }), serverError && (_jsxs(Alert, { status: "error", borderRadius: "lg", children: [_jsx(AlertIcon, {}), serverError] })), _jsxs(Stack, { as: "form", spacing: 5, onSubmit: (event) => void submitHandler(event), children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Full name" }), _jsx(Input, { type: "text", ...register('full_name'), autoComplete: "name" })] }), _jsxs(FormControl, { isInvalid: Boolean(emailError), children: [_jsx(FormLabel, { children: "Email" }), _jsx(Input, { type: "email", ...register('email'), autoComplete: "email" }), emailError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: emailError }))] }), _jsxs(FormControl, { isInvalid: Boolean(passwordError), children: [_jsx(FormLabel, { children: "Password" }), _jsx(Input, { type: "password", ...register('password'), autoComplete: "new-password" }), _jsx(FormHelperText, { color: "gray.500", children: "8-72 characters, case-sensitive." }), passwordError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: passwordError }))] }), _jsxs(FormControl, { isInvalid: Boolean(confirmPasswordError), children: [_jsx(FormLabel, { children: "Confirm password" }), _jsx(Input, { type: "password", ...register('confirmPassword'), autoComplete: "new-password" }), confirmPasswordError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: confirmPasswordError }))] }), _jsx(Button, { colorScheme: "accent", type: "submit", isLoading: mutation.isPending, children: "Create account" })] }), _jsxs(Alert, { status: "info", borderRadius: "lg", variant: "subtle", children: [_jsx(AlertIcon, {}), _jsxs(Stack, { spacing: 0, fontSize: "sm", color: "gray.700", children: [_jsx(Text, { children: "Need a quick start? Sign in with the demo credentials:" }), _jsxs(Text, { children: [_jsx(Badge, { mr: 2, colorScheme: "accent", children: "Email" }), demoEmail] }), _jsxs(Text, { children: [_jsx(Badge, { mr: 2, colorScheme: "accent", children: "Password" }), demoPassword] })] })] }), _jsxs(Text, { fontSize: "sm", color: "gray.600", textAlign: "center", children: ["Already have an account?", ' ', _jsx(Link, { as: RouterLink, to: "/login", color: "accent.500", fontWeight: "semibold", children: "Sign in instead" })] })] }) })] }) }) }));
};
