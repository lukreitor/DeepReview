import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, FormControl, FormLabel, Input, Link, Stack, Text, useToast, } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useLogin } from '@features/auth/api';
import { useAuthStore } from '@store/authStore';
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
        mutation.mutate(values, {
            onSuccess: (data) => {
                setToken(data.access_token);
                toast({ title: 'Welcome back!', status: 'success' });
                navigate('/dashboard', { replace: true });
            },
            onError: () => {
                toast({
                    title: 'Login failed',
                    description: 'Check your credentials and try again.',
                    status: 'error',
                });
            },
        });
    });
    return (_jsx(Box, { maxW: "md", mx: "auto", py: 10, children: _jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: "Sign in to DeepReview" }), _jsx(Text, { color: "gray.500", children: "Submit code and track AI review insights." })] }), _jsxs(Stack, { as: "form", spacing: 4, onSubmit: (event) => void submitHandler(event), children: [_jsxs(FormControl, { isInvalid: Boolean(emailError), children: [_jsx(FormLabel, { children: "Email" }), _jsx(Input, { type: "email", ...register('email') }), emailError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: emailError }))] }), _jsxs(FormControl, { isInvalid: Boolean(passwordError), children: [_jsx(FormLabel, { children: "Password" }), _jsx(Input, { type: "password", ...register('password') }), passwordError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: passwordError }))] }), _jsx(Button, { colorScheme: "blue", type: "submit", isLoading: mutation.isPending, children: "Sign in" })] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["No account yet?", ' ', _jsx(Link, { as: RouterLink, to: "/register", color: "blue.500", children: "Create one now" })] })] }) }));
};
