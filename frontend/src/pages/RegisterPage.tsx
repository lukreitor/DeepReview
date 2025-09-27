import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Link,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useRegister, type TokenResponse } from '@features/auth/api';
import { useAuthStore, type AuthState } from '@store/authStore';

const baseSchema = z.object({
  full_name: z.string().min(3, 'Full name must be at least 3 characters').optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
});

const schema = baseSchema.refine(
  (values: FormValues) => values.password === values.confirmPassword,
  {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  }
);

type FormValues = z.infer<typeof baseSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = useAuthStore((state: AuthState) => state.token);
  const setToken = useAuthStore((state: AuthState) => state.setToken);
  const mutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
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

  const submitHandler = handleSubmit((values: FormValues) => {
    mutation.mutate(
      { email: values.email, password: values.password, full_name: values.full_name },
      {
        onSuccess: (data: TokenResponse) => {
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
      }
    );
  });

  return (
    <Box maxW="md" mx="auto" py={10}>
      <Stack spacing={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            Join DeepReview
          </Text>
          <Text color="gray.500">Create an account to unlock AI-powered reviews.</Text>
        </Box>
        <Stack as="form" spacing={4} onSubmit={(event) => void submitHandler(event)}>
          <FormControl>
            <FormLabel>Full name</FormLabel>
            <Input type="text" {...register('full_name')} />
          </FormControl>
          <FormControl isInvalid={Boolean(emailError)}>
            <FormLabel>Email</FormLabel>
            <Input type="email" {...register('email')} />
            {emailError && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {emailError}
              </Text>
            )}
          </FormControl>
          <FormControl isInvalid={Boolean(passwordError)}>
            <FormLabel>Password</FormLabel>
            <Input type="password" {...register('password')} />
            {passwordError && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {passwordError}
              </Text>
            )}
          </FormControl>
          <FormControl isInvalid={Boolean(confirmPasswordError)}>
            <FormLabel>Confirm password</FormLabel>
            <Input type="password" {...register('confirmPassword')} />
            {confirmPasswordError && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {confirmPasswordError}
              </Text>
            )}
          </FormControl>
          <Button colorScheme="blue" type="submit" isLoading={mutation.isPending}>
            Create account
          </Button>
        </Stack>
        <Text fontSize="sm" color="gray.500">
          Already have an account?{' '}
          <Link as={RouterLink} to="/login" color="blue.500">
            Sign in instead
          </Link>
        </Text>
      </Stack>
    </Box>
  );
};
