import { Avatar, Box, Button, Flex, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, NavLink } from 'react-router-dom';

import type { AuthState } from '@store/authStore';
import type { IconType } from 'react-icons';
import { Icon } from '@chakra-ui/react';

export type NavItem = {
  label: string;
  to: string;
  requiresAuth: boolean;
  icon: IconType;
};

export type SidebarNavProps = {
  navItems: NavItem[];
  profile: AuthState['profile'];
  isAuthenticated: boolean;
  onLogout: () => void;
};

export const SidebarNav = ({ navItems, profile, isAuthenticated, onLogout }: SidebarNavProps) => {
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
            <AuthenticatedSidebar profile={profile} onLogout={onLogout} />
          ) : (
            <AnonymousSidebar />
          )}
        </Box>
      </Flex>
    </Box>
  );
};

const AuthenticatedSidebar = ({
  profile,
  onLogout,
}: {
  profile: AuthState['profile'];
  onLogout: () => void;
}) => (
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
);

const AnonymousSidebar = () => (
  <Stack spacing={2}>
    <Button as={RouterLink} to="/login" colorScheme="brand" size="sm">
      Login
    </Button>
    <Button as={RouterLink} to="/register" variant="outline" size="sm">
      Create account
    </Button>
  </Stack>
);
