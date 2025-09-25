import { Box, Container, Stack, Text } from '@chakra-ui/react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { SubmitPage } from './pages/SubmitPage';

export default function App() {
  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={6}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold">
            DeepReview
          </Text>
          <Text color="gray.500">AI-assisted code review insights</Text>
        </Box>
        <Routes>
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<Navigate to="/submit" />} />
        </Routes>
      </Stack>
    </Container>
  );
}
