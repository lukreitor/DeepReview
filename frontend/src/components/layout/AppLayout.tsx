import {
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  HStack,
  Stack,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

import { useAuthStore, type AuthState } from '@store/authStore';
import { FiBarChart2, FiSend } from 'react-icons/fi';
import { useReviewStream } from '@features/reviews/api';
import { SidebarNav, type NavItem } from './SidebarNav';
import {
  BrandNavItems,
  DesktopAuthActions,
  GuestActions,
  MobileNavLinks,
  MobileToggle,
} from './TopNavActions';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', requiresAuth: true, icon: FiBarChart2 },
  { label: 'Submit review', to: '/submit', requiresAuth: false, icon: FiSend },
];

const getNavItems = (isAuthenticated: boolean) =>
  NAV_ITEMS.filter((item) => (item.requiresAuth ? isAuthenticated : true));

export const AppLayout = () => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const token = useAuthStore((state: AuthState) => state.token);
  const profile = useAuthStore((state: AuthState) => state.profile);
  const logout = useAuthStore((state: AuthState) => state.logout);
  const navigate = useNavigate();
  useReviewStream();

  const isAuthenticated = Boolean(token);
  const navItems = useMemo(() => getNavItems(isAuthenticated), [isAuthenticated]);
  const headerBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    onClose();
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-b, gray.50, white)">
      <Box
        borderBottomWidth="1px"
        borderColor={borderColor}
        bg={headerBg}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <Flex h={16} align="center" justify="space-between">
            <HStack spacing={6} align="center">
              <Button
                as={RouterLink}
                to="/submit"
                variant="ghost"
                fontSize="lg"
                fontWeight="bold"
                color="brand.600"
                _hover={{ bg: 'brand.50', color: 'brand.700' }}
                onClick={onClose}
              >
                DeepReview
              </Button>
              <BrandNavItems navItems={navItems} onNavigate={onClose} />
            </HStack>
            <Flex align="center" gap={3}>
              <MobileToggle isOpen={isOpen} onToggle={onToggle} />
              <Box display={{ base: 'none', md: 'block' }}>
                <DesktopAuthActions
                  isAuthenticated={isAuthenticated}
                  profile={profile}
                  onLogout={handleLogout}
                />
              </Box>
            </Flex>
          </Flex>
        </Container>
        <Collapse in={isOpen} animateOpacity>
          <Box pb={4} display={{ md: 'none' }}>
            <Stack spacing={3} px={4}>
              <MobileNavLinks navItems={navItems} onNavigate={onClose} />
              {isAuthenticated ? (
                <Button variant="outline" colorScheme="brand" onClick={handleLogout}>
                  Sign out
                </Button>
              ) : (
                <GuestActions onNavigate={onClose} />
              )}
            </Stack>
          </Box>
        </Collapse>
      </Box>
      <Flex as="section" align="stretch" minH="calc(100vh - 4rem)">
        <SidebarNav
          navItems={navItems}
          profile={profile}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
        <Box as="main" flex="1" py={{ base: 6, md: 10 }} px={{ base: 4, md: 8 }} minW={0}>
          <Outlet />
        </Box>
      </Flex>
    </Box>
  );
};
