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
  FormHelperText,
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

import { useRegister, type TokenResponse } from '@features/auth/api';
import { useAuthStore, type AuthState } from '@store/authStore';
import { getApiErrorMessage } from '@services/api';

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
    setServerError(null);
    mutation.mutate(
      { email: values.email, password: values.password, full_name: values.full_name },
      {
        onSuccess: (data: TokenResponse) => {
          setToken(data.access_token);
          toast({ title: 'Account created', status: 'success' });
          navigate('/dashboard', { replace: true });
        },
        onError: (error) => {
          const message = getApiErrorMessage(
            error,
            'Try a different email or adjust your password.'
          );
          setServerError(message);
          toast({
            title: 'Registration failed',
            description: message,
            status: 'error',
          });
        },
      }
    );
  });

  return (
    <Flex minH="100vh" bgGradient="linear(to-br, gray.50, white)" align="center">
      <Container maxW="6xl" py={{ base: 12, md: 16 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 10, md: 14 }} alignItems="center">
          <Stack spacing={8} pr={{ md: 12 }}>
            <Badge colorScheme="accent" alignSelf="flex-start" borderRadius="full" px={3} py={1}>
              Get started fast
            </Badge>
            <Heading size="lg">Create your DeepReview workspace in minutes</Heading>
            <Text color="gray.600">
              Collaborate with AI-reinforced reviewers, track quality trends, and keep code health
              transparent across your team.
            </Text>
            <Stack spacing={3} color="gray.700">
              <Stack direction="row" align="center" spacing={3}>
                <Icon as={MdCheckCircle} color="accent.500" boxSize={5} />
                <Text>Unlimited submissions during preview.</Text>
              </Stack>
              <Stack direction="row" align="center" spacing={3}>
                <Icon as={MdCheckCircle} color="accent.500" boxSize={5} />
                <Text>Detailed analytics to surface regressions quickly.</Text>
              </Stack>
              <Stack direction="row" align="center" spacing={3}>
                <Icon as={MdCheckCircle} color="accent.500" boxSize={5} />
                <Text>Invite teammates to share review queues.</Text>
              </Stack>
            </Stack>
            <ButtonGroup size="sm">
              <Button as={RouterLink} to="/login" variant="outline" colorScheme="accent">
                Already have an account?
              </Button>
              <Button as={RouterLink} to="/submit" variant="ghost" colorScheme="accent">
                Preview the workflow
              </Button>
            </ButtonGroup>
          </Stack>
          <Box bg="white" borderRadius="2xl" boxShadow="2xl" p={{ base: 6, md: 8 }}>
            <Stack spacing={6}>
              <Stack spacing={1}>
                <Heading size="md">Join DeepReview</Heading>
                <Text color="gray.500">Create an account to unlock AI-powered reviews.</Text>
              </Stack>

              {serverError && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {serverError}
                </Alert>
              )}

              <Stack as="form" spacing={5} onSubmit={(event) => void submitHandler(event)}>
                <FormControl>
                  <FormLabel>Full name</FormLabel>
                  <Input type="text" {...register('full_name')} autoComplete="name" />
                </FormControl>
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
                  <Input type="password" {...register('password')} autoComplete="new-password" />
                  <FormHelperText color="gray.500">8-72 characters, case-sensitive.</FormHelperText>
                  {passwordError && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {passwordError}
                    </Text>
                  )}
                </FormControl>
                <FormControl isInvalid={Boolean(confirmPasswordError)}>
                  <FormLabel>Confirm password</FormLabel>
                  <Input
                    type="password"
                    {...register('confirmPassword')}
                    autoComplete="new-password"
                  />
                  {confirmPasswordError && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {confirmPasswordError}
                    </Text>
                  )}
                </FormControl>
                <Button colorScheme="accent" type="submit" isLoading={mutation.isPending}>
                  Create account
                </Button>
              </Stack>
              <Alert status="info" borderRadius="lg" variant="subtle">
                <AlertIcon />
                <Stack spacing={0} fontSize="sm" color="gray.700">
                  <Text>Need a quick start? Sign in with the demo credentials:</Text>
                  <Text>
                    <Badge mr={2} colorScheme="accent">
                      Email
                    </Badge>
                    {demoEmail}
                  </Text>
                  <Text>
                    <Badge mr={2} colorScheme="accent">
                      Password
                    </Badge>
                    {demoPassword}
                  </Text>
                </Stack>
              </Alert>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Already have an account?{' '}
                <Link as={RouterLink} to="/login" color="accent.500" fontWeight="semibold">
                  Sign in instead
                </Link>
              </Text>
            </Stack>
          </Box>
        </SimpleGrid>
      </Container>
    </Flex>
  );
};
