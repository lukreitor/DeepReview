import {
  Avatar,
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

import { useAuthStore, type AuthState } from '@store/authStore';
import type { IconType } from 'react-icons';
import { FiBarChart2, FiSend } from 'react-icons/fi';
import { useReviewStream } from '@features/reviews/api';

type NavItem = {
  label: string;
  to: string;
  requiresAuth: boolean;
  icon: IconType;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', requiresAuth: true, icon: FiBarChart2 },
  { label: 'Submit review', to: '/submit', requiresAuth: false, icon: FiSend },
];

const activeStyles = {
  bg: 'brand.500',
  color: 'white',
  _hover: { bg: 'brand.600', color: 'white' },
};

const inactiveStyles = {
  variant: 'ghost' as const,
  color: 'gray.700',
  _hover: { bg: 'gray.100', color: 'gray.900' },
};

const getNavItems = (isAuthenticated: boolean) =>
  NAV_ITEMS.filter((item) => (item.requiresAuth ? isAuthenticated : true));

export const AppLayout = () => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const token = useAuthStore((state: AuthState) => state.token);
  const profile = useAuthStore((state: AuthState) => state.profile);
  const logout = useAuthStore((state: AuthState) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
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
              <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                {navItems.map((item) => (
                  <NavButton key={item.to} to={item.to} label={item.label} onNavigate={onClose} />
                ))}
              </HStack>
            </HStack>
            <Flex align="center" gap={3}>
              <IconButton
                size="md"
                aria-label="Toggle navigation"
                icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                display={{ base: 'flex', md: 'none' }}
                onClick={onToggle}
                variant="ghost"
              />
              <Box display={{ base: 'none', md: 'block' }}>
                {isAuthenticated ? (
                  <UserMenu
                    email={profile?.email}
                    name={profile?.full_name}
                    onLogout={handleLogout}
                    currentPath={location.pathname}
                  />
                ) : (
                  <GuestActions onNavigate={onClose} />
                )}
              </Box>
            </Flex>
          </Flex>
        </Container>
        <Collapse in={isOpen} animateOpacity>
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as="nav" spacing={3} px={4}>
              {navItems.map((item) => (
                <NavButton key={item.to} to={item.to} label={item.label} onNavigate={onClose} />
              ))}
              {isAuthenticated ? (
                <Button variant="outline" colorScheme="brand" onClick={handleLogout}>
                  Sign out
                </Button>
              ) : (
                <Stack spacing={2}>
                  <Button as={RouterLink} to="/login" colorScheme="brand" onClick={onClose}>
                    Login
                  </Button>
                  <Button as={RouterLink} to="/register" variant="outline" onClick={onClose}>
                    Create account
                  </Button>
                </Stack>
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

type SidebarNavProps = {
  navItems: NavItem[];
  profile: AuthState['profile'];
  isAuthenticated: boolean;
  onLogout: () => void;
};

const SidebarNav = ({ navItems, profile, isAuthenticated, onLogout }: SidebarNavProps) => {
  const sidebarBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  if (!navItems.length && !isAuthenticated) {
    return null;
  }

  return (
    <Box
      as="aside"
      width={{ base: '0', md: '64' }}
      display={{ base: 'none', md: 'flex' }}
      flexShrink={0}
      bg={sidebarBg}
      borderRightWidth="1px"
      borderColor={borderColor}
    >
      <Flex direction="column" w="full" h="full" px={6} py={8} gap={8}>
        <Stack spacing={1}>
          {navItems.map((item) => (
            <Button
              key={item.to}
              as={NavLink}
              to={item.to}
              justifyContent="flex-start"
              variant="ghost"
              leftIcon={<Icon as={item.icon} boxSize={5} />}
              px={4}
              py={3}
              borderRadius="lg"
              fontWeight="medium"
              _activeLink={{
                bg: 'brand.50',
                color: 'brand.600',
                fontWeight: 'semibold',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
        <Box mt="auto" pt={6} borderTopWidth="1px" borderColor={borderColor}>
          {isAuthenticated ? (
            <Stack spacing={3}>
              <Flex align="center" gap={3}>
                <Avatar size="sm" name={profile?.full_name ?? profile?.email ?? 'Account'} />
                <Box>
                  <Text fontSize="sm" fontWeight="semibold">
                    {profile?.full_name ?? 'Your workspace'}
                  </Text>
                  {profile?.email && (
                    <Text fontSize="xs" color="gray.500">
                      {profile.email}
                    </Text>
                  )}
                </Box>
              </Flex>
              <Button variant="outline" colorScheme="brand" size="sm" onClick={onLogout}>
                Sign out
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Button as={RouterLink} to="/login" colorScheme="brand" size="sm">
                Login
              </Button>
              <Button as={RouterLink} to="/register" variant="outline" size="sm">
                Create account
              </Button>
            </Stack>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

const NavButton = ({
  to,
  label,
  onNavigate,
}: {
  to: string;
  label: string;
  onNavigate: () => void;
}) => {
  return (
    <Button
      as={NavLink}
      to={to}
      px={4}
      size="sm"
      {...inactiveStyles}
      _activeLink={activeStyles}
      onClick={onNavigate}
    >
      {label}
    </Button>
  );
};

const GuestActions = ({ onNavigate }: { onNavigate: () => void }) => (
  <HStack spacing={3}>
    <Button
      as={RouterLink}
      to="/login"
      variant="ghost"
      colorScheme="brand"
      size="sm"
      onClick={onNavigate}
    >
      Login
    </Button>
    <Button as={RouterLink} to="/register" colorScheme="brand" size="sm" onClick={onNavigate}>
      Sign up
    </Button>
  </HStack>
);

const UserMenu = ({
  email,
  name,
  onLogout,
  currentPath,
}: {
  email?: string;
  name?: string | null;
  onLogout: () => void;
  currentPath: string;
}) => {
  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        variant="outline"
        size="sm"
        leftIcon={<Avatar size="xs" name={name ?? email ?? 'User'} />}
      >
        <Text as="span" noOfLines={1} maxW={{ base: '120px', md: '160px' }}>
          {name || email || 'Account'}
        </Text>
      </MenuButton>
      <MenuList>
        <MenuItem as={RouterLink} to="/dashboard" isDisabled={currentPath === '/dashboard'}>
          Dashboard
        </MenuItem>
        <MenuItem as={RouterLink} to="/submit" isDisabled={currentPath === '/submit'}>
          Submit review
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onLogout}>Sign out</MenuItem>
      </MenuList>
    </Menu>
  );
};
