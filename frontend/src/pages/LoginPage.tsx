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
import { useForm, type Resolver } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useLogin, type TokenResponse } from '@features/auth/api';
import { useAuthStore, type AuthState } from '@store/authStore';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

const formResolver: Resolver<FormValues> = zodResolver(schema) as Resolver<FormValues>; // eslint-disable-line @typescript-eslint/no-unsafe-call

export const LoginPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const token = useAuthStore((state: AuthState) => state.token);
  const setToken = useAuthStore((state: AuthState) => state.setToken);
  const mutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: formResolver,
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

  const submitHandler = handleSubmit((values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: (data: TokenResponse) => {
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

  return (
    <Box maxW="md" mx="auto" py={10}>
      <Stack spacing={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            Sign in to DeepReview
          </Text>
          <Text color="gray.500">Submit code and track AI review insights.</Text>
        </Box>
        <Stack as="form" spacing={4} onSubmit={(event) => void submitHandler(event)}>
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
          <Button colorScheme="blue" type="submit" isLoading={mutation.isPending}>
            Sign in
          </Button>
        </Stack>
        <Text fontSize="sm" color="gray.500">
          No account yet?{' '}
          <Link as={RouterLink} to="/register" color="blue.500">
            Create one now
          </Link>
        </Text>
      </Stack>
    </Box>
  );
};
