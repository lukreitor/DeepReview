import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Stack,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateReview } from '@features/reviews/api';

const schema = z.object({
  language: z.string().min(1, 'Language is required'),
  content: z.string().min(10, 'Provide at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

export const SubmitPage = () => {
  const toast = useToast();
  const mutation = useCreateReview();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      language: 'python',
      content: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      { ...values, source: 'code', metadata: { submittedVia: 'web' } },
      {
        onSuccess: () => {
          toast({
            title: 'Submission queued',
            description: 'We will notify you once the review is ready.',
            status: 'success',
          });
          reset();
        },
        onError: () => {
          toast({
            title: 'Submission failed',
            description: 'Please try again or contact support.',
            status: 'error',
          });
        },
      }
    );
  };

  return (
    <Stack as="form" spacing={4} onSubmit={handleSubmit(onSubmit)}>
      <FormControl>
        <FormLabel>Language</FormLabel>
        <Select {...register('language')}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="go">Go</option>
          <option value="java">Java</option>
        </Select>
      </FormControl>

      <FormControl isInvalid={Boolean(errors.content)}>
        <FormLabel>Code snippet</FormLabel>
        <Textarea rows={12} fontFamily="mono" {...register('content')} />
        {errors.content && (
          <Badge colorScheme="red" mt={2} alignSelf="flex-start">
            {errors.content.message}
          </Badge>
        )}
      </FormControl>

      <Box>
        <Button colorScheme="blue" type="submit" isLoading={mutation.isPending}>
          Submit for review
        </Button>
      </Box>
    </Stack>
  );
};
