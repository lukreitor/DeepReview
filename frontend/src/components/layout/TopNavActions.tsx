import {
  Avatar,
  Button,
  HStack,
  Stack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

import type { AuthState } from '@store/authStore';
import type { NavItem } from './SidebarNav';

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

export const useTopNavDisclosure = () => {
  const disclosure = useDisclosure();
  return disclosure;
};

export const BrandNavItems = ({
  navItems,
  onNavigate,
}: {
  navItems: NavItem[];
  onNavigate: () => void;
}) => (
  <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
    {navItems.map((item) => (
      <Button
        key={item.to}
        as={NavLink}
        to={item.to}
        px={4}
        size="sm"
        {...inactiveStyles}
        _activeLink={activeStyles}
        onClick={onNavigate}
      >
        {item.label}
      </Button>
    ))}
  </HStack>
);

export const MobileNavLinks = ({
  navItems,
  onNavigate,
}: {
  navItems: NavItem[];
  onNavigate: () => void;
}) => (
  <Stack as="nav" spacing={3} px={4}>
    {navItems.map((item) => (
      <Button
        key={item.to}
        as={NavLink}
        to={item.to}
        justifyContent="flex-start"
        variant="ghost"
        onClick={onNavigate}
      >
        {item.label}
      </Button>
    ))}
  </Stack>
);

export const MobileToggle = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => (
  <IconButton
    size="md"
    aria-label="Toggle navigation"
    icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
    display={{ base: 'flex', md: 'none' }}
    onClick={onToggle}
    variant="ghost"
  />
);

export const DesktopAuthActions = ({
  isAuthenticated,
  profile,
  onLogout,
}: {
  isAuthenticated: boolean;
  profile: AuthState['profile'];
  onLogout: () => void;
}) => {
  const location = useLocation();

  if (isAuthenticated) {
    return <UserMenu profile={profile} onLogout={onLogout} currentPath={location.pathname} />;
  }
  return <GuestActions />;
};

export const GuestActions = ({ onNavigate }: { onNavigate?: () => void } = {}) => (
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

export const UserMenu = ({
  profile,
  onLogout,
  currentPath,
}: {
  profile: AuthState['profile'];
  onLogout: () => void;
  currentPath: string;
}) => {
  const displayName = useMemo(() => profile?.full_name || profile?.email || 'Account', [profile]);

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        variant="outline"
        size="sm"
        leftIcon={<Avatar size="xs" name={displayName} />}
      >
        <Text as="span" noOfLines={1} maxW={{ base: '120px', md: '160px' }}>
          {displayName}
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
