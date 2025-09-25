import {
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';

import { useListReviews } from '@features/reviews/api';

export const DashboardPage = () => {
  const { data, isLoading } = useListReviews();

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
      <Card>
        <CardBody>
          <Heading size="md">Average Score</Heading>
          <Stat mt={4}>
            <StatLabel>Overall</StatLabel>
            <StatNumber>{isLoading ? '...' : data?.avgScore ?? '—'}</StatNumber>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Heading size="md">Reviews queued</Heading>
          <Text mt={4}>{isLoading ? 'Loading…' : data?.items?.length ?? 0}</Text>
        </CardBody>
      </Card>
    </SimpleGrid>
  );
};
