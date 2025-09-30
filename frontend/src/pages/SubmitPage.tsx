import {
  Alert,
  AlertDescription,
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
  HStack,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, lazy, useRef, useState, type ChangeEvent } from 'react';
import { Controller, useForm, type ControllerRenderProps } from 'react-hook-form';
import { MdCheckCircle, MdMic } from 'react-icons/md';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

import { useCreateReview } from '@features/reviews/api';
import { ReviewQueue } from '@components/ReviewQueue';
import { useAuthStore, type AuthState } from '@store/authStore';
import { getApiErrorMessage } from '@services/api';

const codeSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  content: z.string().min(10, 'Provide at least 10 characters of code'),
});

type CodeFormValues = z.infer<typeof codeSchema>;

export const SubmitPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const token = useAuthStore((state: AuthState) => state.token);
  const isAuthenticated = Boolean(token);
  const demoEmail =
    (import.meta.env.VITE_DEMO_USER_EMAIL as string | undefined) ?? 'demo@deepreview.dev';
  const demoPassword =
    (import.meta.env.VITE_DEMO_USER_PASSWORD as string | undefined) ?? 'DeepReview!123';
  const [mode, setMode] = useState<'code' | 'audio'>('code');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mutation = useCreateReview();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      language: 'python',
      content: "def handler(event):\n    return 'Hello from DeepReview'",
    },
  });

  const watchedLanguage = watch('language');
  const contentError = errors.content?.message;

  const handleAudioSelection = (files: FileList | null) => {
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

  const submitCode = (values: CodeFormValues) => {
    if (!isAuthenticated) {
      promptLogin();
      return;
    }
    mutation.mutate(
      {
        language: values.language,
        content: values.content,
        source: 'code',
        metadata: { submittedVia: 'web', mode: 'code' },
      },
      {
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
      }
    );
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

    mutation.mutate(
      {
        source: 'audio',
        audio_base64: audioBase64,
        language: watchedLanguage,
        metadata: { submittedVia: 'web', mode: 'audio' },
      },
      {
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
      }
    );
  };

  const handleCodeSubmit = handleSubmit((values: CodeFormValues) => {
    submitCode(values);
  });

  return (
    <Flex minH="100vh" bgGradient="linear(to-br, gray.50, white)" align="flex-start">
      <Container maxW="6xl" py={{ base: 12, md: 16 }}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 10, lg: 16 }} alignItems="start">
          <Stack spacing={8} pr={{ lg: 12 }}>
            <Badge colorScheme="brand" alignSelf="flex-start" borderRadius="full" px={3} py={1}>
              Unified review workflow
            </Badge>
            <Heading size="lg">Submit code or audio and get AI feedback instantly</Heading>
            <Text color="gray.600">
              DeepReview normalizes your submissions, queues them for analysis, and shares results
              with your entire team in real time.
            </Text>
            <Stack spacing={3} color="gray.700">
              {[
                'Support for multiple languages and audio-to-code transcription.',
                'Real-time queue updates and analytics insights.',
                'Demo workspace available to explore without creating an account.',
              ].map((item) => (
                <Stack direction="row" align="center" spacing={3} key={item}>
                  <Icon as={MdCheckCircle} color="brand.500" boxSize={5} />
                  <Text>{item}</Text>
                </Stack>
              ))}
            </Stack>
            <Alert status="info" variant="subtle" borderRadius="lg">
              <AlertIcon />
              <Stack spacing={0} fontSize="sm" color="gray.700">
                <Text>Demo credentials for quick access:</Text>
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
            {!isAuthenticated && (
              <ButtonGroup size="sm">
                <Button colorScheme="brand" onClick={() => navigate('/login')}>
                  Go to login
                </Button>
                <Button variant="outline" onClick={() => navigate('/register')}>
                  Create an account
                </Button>
              </ButtonGroup>
            )}
          </Stack>
          <Box bg="white" borderRadius="2xl" boxShadow="2xl" p={{ base: 6, md: 8 }}>
            <Stack spacing={6}>
              <Stack spacing={1}>
                <Heading size="md">Submit for review</Heading>
                <Text color="gray.500">
                  Choose the best format for your team—code snippets or voice notes.
                </Text>
              </Stack>
              {!isAuthenticated && (
                <Alert status="info" variant="left-accent" borderRadius="lg">
                  <AlertIcon />
                  <AlertDescription>
                    Sign in to keep a history of submissions and receive live updates.
                  </AlertDescription>
                </Alert>
              )}
              <FormControl>
                <FormLabel>Language</FormLabel>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} value={field.value ?? ''}>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="go">Go</option>
                      <option value="java">Java</option>
                    </Select>
                  )}
                />
                {mode === 'audio' && (
                  <FormHelperText>
                    We use this setting to prime the transcription prompt for audio uploads.
                  </FormHelperText>
                )}
              </FormControl>
              <Tabs
                index={mode === 'code' ? 0 : 1}
                onChange={(index: number) => setMode(index === 0 ? 'code' : 'audio')}
                variant="enclosed"
                colorScheme="brand"
              >
                <TabList bg="gray.50" borderRadius="xl" p={2}>
                  <Tab borderRadius="lg">Code editor</Tab>
                  <Tab display="flex" gap={2} alignItems="center" borderRadius="lg">
                    <Icon as={MdMic} /> Audio (Whisper)
                  </Tab>
                </TabList>
                <TabPanels mt={4}>
                  <TabPanel px={0}>
                    <Stack as="form" spacing={6} onSubmit={(event) => void handleCodeSubmit(event)}>
                      <FormControl isInvalid={Boolean(contentError)}>
                        <FormLabel>Snippet</FormLabel>
                        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                          <Controller
                            name="content"
                            control={control}
                            render={({
                              field,
                            }: {
                              field: ControllerRenderProps<CodeFormValues, 'content'>;
                            }) => (
                              <Suspense
                                fallback={
                                  <Flex
                                    height="400px"
                                    align="center"
                                    justify="center"
                                    bg="gray.100"
                                  >
                                    <Spinner color="brand.500" thickness="4px" />
                                  </Flex>
                                }
                              >
                                <MonacoEditor
                                  height="400px"
                                  language={watchedLanguage || 'python'}
                                  theme="vs-light"
                                  value={field.value}
                                  onChange={(value: string | undefined) =>
                                    field.onChange(value ?? '')
                                  }
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                  }}
                                />
                              </Suspense>
                            )}
                          />
                        </Box>
                        {contentError && (
                          <Text fontSize="sm" color="red.500" mt={2}>
                            {contentError}
                          </Text>
                        )}
                      </FormControl>

                      <HStack justify="flex-end">
                        <Button
                          type="submit"
                          isLoading={mutation.isPending}
                          isDisabled={!isAuthenticated}
                          colorScheme="brand"
                        >
                          Submit for review
                        </Button>
                      </HStack>
                    </Stack>
                  </TabPanel>
                  <TabPanel px={0}>
                    <Stack spacing={5}>
                      <Text fontSize="sm" color="gray.500">
                        Selected language: {watchedLanguage?.toUpperCase()}
                      </Text>
                      <FormControl>
                        <FormLabel>Audio file</FormLabel>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            handleAudioSelection(event.target.files)
                          }
                        />
                        <FormHelperText>
                          The audio should describe the code you want to generate. Files up to 25MB
                          are supported.
                        </FormHelperText>
                        {audioBase64 && (
                          <Text fontSize="sm" color="green.500" mt={1}>
                            File prepared ({Math.round((audioBase64.length * 3) / 4 / 1024)} KB)
                          </Text>
                        )}
                      </FormControl>

                      <HStack justify="flex-end">
                        <Button
                          variant="solid"
                          colorScheme="accent"
                          onClick={submitAudio}
                          isLoading={mutation.isPending}
                          isDisabled={!isAuthenticated}
                        >
                          Transcribe and review
                        </Button>
                      </HStack>
                    </Stack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Stack>
          </Box>
        </SimpleGrid>
        <Box mt={{ base: 12, md: 16 }}>
          <Heading size="md" mb={2}>
            Live review queue
          </Heading>
          <Text color="gray.600">
            Track statuses, scores, and AI insights as soon as they are ready.
          </Text>
          <Box mt={6}>
            <ReviewQueue />
          </Box>
        </Box>
      </Container>
    </Flex>
  );
};
