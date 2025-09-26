import {
  Badge,
  Box,
  Button,
  Center,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  Select,
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
import { MdMic } from 'react-icons/md';
import { z } from 'zod';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

import { useCreateReview } from '@features/reviews/api';
import { ReviewQueue } from '@components/ReviewQueue';

const codeSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  content: z.string().min(10, 'Provide at least 10 characters of code'),
});

type CodeFormValues = z.infer<typeof codeSchema>;

export const SubmitPage = () => {
  const toast = useToast();
  const [mode, setMode] = useState<'code' | 'audio'>('code');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mutation = useCreateReview();

  const {
    control,
    register,
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

  const submitCode = (values: CodeFormValues) => {
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
        onError: () => {
          toast({
            title: 'Submission failed',
            description: 'Check the details and try again.',
            status: 'error',
          });
        },
      }
    );
  };

  const submitAudio = () => {
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
        onError: () => {
          toast({
            title: 'Audio submission failed',
            description: 'Try again or contact the support team.',
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
    <Stack spacing={8}>
      <Box>
        <Tabs
          index={mode === 'code' ? 0 : 1}
          onChange={(index: number) => setMode(index === 0 ? 'code' : 'audio')}
          isFitted
          variant="enclosed"
        >
          <TabList>
            <Tab>Code editor</Tab>
            <Tab display="flex" gap={2} alignItems="center">
              <Icon as={MdMic} /> Audio (Whisper)
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <Stack as="form" spacing={5} onSubmit={(event) => void handleCodeSubmit(event)}>
                <FormControl>
                  <FormLabel>Language</FormLabel>
                  <Select {...register('language')}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="go">Go</option>
                    <option value="java">Java</option>
                  </Select>
                </FormControl>

                <FormControl isInvalid={Boolean(contentError)}>
                  <FormLabel>Snippet</FormLabel>
                  <Box borderWidth="1px" borderRadius="md" overflow="hidden">
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
                            <Center height="400px" bg="gray.900">
                              <Spinner color="blue.400" thickness="4px" />
                            </Center>
                          }
                        >
                          <MonacoEditor
                            height="400px"
                            language={watchedLanguage || 'python'}
                            theme="vs-dark"
                            value={field.value}
                            onChange={(value: string | undefined) => field.onChange(value ?? '')}
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
                    <Badge colorScheme="red" mt={2} alignSelf="flex-start">
                      {contentError}
                    </Badge>
                  )}
                </FormControl>

                <HStack justify="flex-end">
                  <Button colorScheme="blue" type="submit" isLoading={mutation.isPending}>
                    Submit for review
                  </Button>
                </HStack>
              </Stack>
            </TabPanel>
            <TabPanel px={0}>
              <Stack spacing={5}>
                <FormControl>
                  <FormLabel>Expected language</FormLabel>
                  <Select {...register('language')}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="go">Go</option>
                    <option value="java">Java</option>
                  </Select>
                  <FormHelperText>
                    We use this field to prime the AI prompt, but transcription will still try to
                    identify the correct language automatically.
                  </FormHelperText>
                </FormControl>

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
                    The audio should describe the code you want to generate. Files up to 25MB are
                    supported.
                  </FormHelperText>
                  {audioBase64 && (
                    <Text fontSize="sm" color="green.500" mt={1}>
                      File prepared ({Math.round((audioBase64.length * 3) / 4 / 1024)} KB)
                    </Text>
                  )}
                </FormControl>

                <HStack justify="flex-end">
                  <Button colorScheme="purple" onClick={submitAudio} isLoading={mutation.isPending}>
                    Transcribe and review
                  </Button>
                </HStack>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <ReviewQueue />
    </Stack>
  );
};
