import { Box, Container, Stack, Text } from '@chakra-ui/react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { SubmitPage } from './pages/SubmitPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  return (
    <Box bgGradient="linear(to-b, brand.50, white)" minH="100vh" py={{ base: 8, md: 12 }}>
      <Container maxW="6xl">
        <Stack spacing={10}>
          <Box
            bgGradient="linear(to-r, brand.500, brand.600)"
            color="white"
            borderRadius="3xl"
            px={{ base: 6, md: 12 }}
            py={{ base: 8, md: 12 }}
            boxShadow="2xl"
          >
            <Stack spacing={4} maxW="3xl">
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                textTransform="uppercase"
                letterSpacing="wide"
                color="whiteAlpha.800"
              >
                DeepReview platform
              </Text>
              <Text fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">
                Give your team calm, high-signal AI feedback on every pull request.
              </Text>
              <Text fontSize={{ base: 'md', md: 'lg' }} color="whiteAlpha.900">
                Submit code or voice notes, watch real-time review progress, and explore analytics
                that keep quality moving forward.
              </Text>
            </Stack>
          </Box>

          <Box
            bg="white"
            borderRadius="3xl"
            boxShadow="xl"
            px={{ base: 4, md: 10 }}
            py={{ base: 6, md: 10 }}
          >
            <Routes>
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<Navigate to="/submit" />} />
            </Routes>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
