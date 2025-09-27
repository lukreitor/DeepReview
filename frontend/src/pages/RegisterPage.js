import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, FormControl, FormLabel, Input, Link, Stack, Text, useToast, } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useRegister } from '@features/auth/api';
import { useAuthStore } from '@store/authStore';
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
        mutation.mutate({ email: values.email, password: values.password, full_name: values.full_name }, {
            onSuccess: (data) => {
                setToken(data.access_token);
                toast({ title: 'Account created', status: 'success' });
                navigate('/dashboard', { replace: true });
            },
            onError: () => {
                toast({
                    title: 'Registration failed',
                    description: 'Try a different email address or contact support.',
                    status: 'error',
                });
            },
        });
    });
    return (_jsx(Box, { maxW: "md", mx: "auto", py: 10, children: _jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: "Join DeepReview" }), _jsx(Text, { color: "gray.500", children: "Create an account to unlock AI-powered reviews." })] }), _jsxs(Stack, { as: "form", spacing: 4, onSubmit: (event) => void submitHandler(event), children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Full name" }), _jsx(Input, { type: "text", ...register('full_name') })] }), _jsxs(FormControl, { isInvalid: Boolean(emailError), children: [_jsx(FormLabel, { children: "Email" }), _jsx(Input, { type: "email", ...register('email') }), emailError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: emailError }))] }), _jsxs(FormControl, { isInvalid: Boolean(passwordError), children: [_jsx(FormLabel, { children: "Password" }), _jsx(Input, { type: "password", ...register('password') }), passwordError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: passwordError }))] }), _jsxs(FormControl, { isInvalid: Boolean(confirmPasswordError), children: [_jsx(FormLabel, { children: "Confirm password" }), _jsx(Input, { type: "password", ...register('confirmPassword') }), confirmPasswordError && (_jsx(Text, { fontSize: "sm", color: "red.500", mt: 1, children: confirmPasswordError }))] }), _jsx(Button, { colorScheme: "blue", type: "submit", isLoading: mutation.isPending, children: "Create account" })] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Already have an account?", ' ', _jsx(Link, { as: RouterLink, to: "/login", color: "blue.500", children: "Sign in instead" })] })] }) }));
};
