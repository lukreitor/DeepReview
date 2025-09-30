import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  Link,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MdCheckCircle } from 'react-icons/md';

import { useLogin, type TokenResponse } from '@features/auth/api';
import { useAuthStore, type AuthState } from '@store/authStore';
import { getApiErrorMessage } from '@services/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const token = useAuthStore((state: AuthState) => state.token);
  const setToken = useAuthStore((state: AuthState) => state.setToken);
  const mutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const demoEmail =
    (import.meta.env.VITE_DEMO_USER_EMAIL as string | undefined) ?? 'demo@deepreview.dev';
  const demoPassword =
    (import.meta.env.VITE_DEMO_USER_PASSWORD as string | undefined) ?? 'DeepReview!123';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
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

  const submitHandler = handleSubmit((values: FormValues) => {
    setServerError(null);
    mutation.mutate(values, {
      onSuccess: (data: TokenResponse) => {
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

  return (
    <Flex minH="100vh" bgGradient="linear(to-br, gray.50, white)" align="center">
      <Container maxW="6xl" py={{ base: 12, md: 16 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 10, md: 14 }} alignItems="center">
          <Stack spacing={8} pr={{ md: 12 }}>
            <Badge colorScheme="brand" alignSelf="flex-start" borderRadius="full" px={3} py={1}>
              AI-powered reviews
            </Badge>
            <Heading size="lg">Instant feedback for every code submission</Heading>
            <Text color="gray.600">
              Stay in the loop with actionable AI review insights, faster turnarounds, and a shared
              queue for your team.
            </Text>
            <Stack spacing={3} color="gray.700">
              <Stack direction="row" align="center" spacing={3}>
                <Icon as={MdCheckCircle} color="brand.500" boxSize={5} />
                <Text>Single dashboard for submissions and analytics.</Text>
              </Stack>
              <Stack direction="row" align="center" spacing={3}>
                <Icon as={MdCheckCircle} color="brand.500" boxSize={5} />
                <Text>Zero-config queue with real-time updates.</Text>
              </Stack>
              <Stack direction="row" align="center" spacing={3}>
                <Icon as={MdCheckCircle} color="brand.500" boxSize={5} />
                <Text>Works across languages, audio transcripts, and more.</Text>
              </Stack>
            </Stack>
            <ButtonGroup size="sm">
              <Button as={RouterLink} to="/register" colorScheme="brand" variant="outline">
                Create account
              </Button>
              <Button as={RouterLink} to="/submit" variant="ghost" colorScheme="brand">
                Explore submissions
              </Button>
            </ButtonGroup>
          </Stack>
          <Box bg="white" borderRadius="2xl" boxShadow="2xl" p={{ base: 6, md: 8 }}>
            <Stack spacing={6}>
              <Stack spacing={1}>
                <Heading size="md">Sign in to DeepReview</Heading>
                <Text color="gray.500">Access your workspace and pick up where you left off.</Text>
              </Stack>

              {serverError && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {serverError}
                </Alert>
              )}

              <Stack as="form" spacing={5} onSubmit={(event) => void submitHandler(event)}>
                <FormControl isInvalid={Boolean(emailError)}>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" {...register('email')} autoComplete="email" />
                  {emailError && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {emailError}
                    </Text>
                  )}
                </FormControl>
                <FormControl isInvalid={Boolean(passwordError)}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    {...register('password')}
                    autoComplete="current-password"
                  />
                  {passwordError && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {passwordError}
                    </Text>
                  )}
                </FormControl>
                <Button colorScheme="brand" type="submit" isLoading={mutation.isPending}>
                  Sign in
                </Button>
              </Stack>
              <Alert status="info" borderRadius="lg" variant="subtle">
                <AlertIcon />
                <Stack spacing={0} fontSize="sm" color="gray.700">
                  <Text>Use the demo account to explore without registering:</Text>
                  <Text>
                    <Badge mr={2} colorScheme="brand">
                      Email
                    </Badge>
                    {demoEmail}
                  </Text>
                  <Text>
                    <Badge mr={2} colorScheme="brand">
                      Password
                    </Badge>
                    {demoPassword}
                  </Text>
                </Stack>
              </Alert>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                No account yet?{' '}
                <Link as={RouterLink} to="/register" color="brand.500" fontWeight="semibold">
                  Create one now
                </Link>
              </Text>
            </Stack>
          </Box>
        </SimpleGrid>
      </Container>
    </Flex>
  );
};
