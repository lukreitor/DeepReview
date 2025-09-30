import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, Button, HStack, Stack, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text, useDisclosure, } from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
const activeStyles = {
    bg: 'brand.500',
    color: 'white',
    _hover: { bg: 'brand.600', color: 'white' },
};
const inactiveStyles = {
    variant: 'ghost',
    color: 'gray.700',
    _hover: { bg: 'gray.100', color: 'gray.900' },
};
export const useTopNavDisclosure = () => {
    const disclosure = useDisclosure();
    return disclosure;
};
export const BrandNavItems = ({ navItems, onNavigate, }) => (_jsx(HStack, { spacing: 1, display: { base: 'none', md: 'flex' }, children: navItems.map((item) => (_jsx(Button, { as: NavLink, to: item.to, px: 4, size: "sm", ...inactiveStyles, _activeLink: activeStyles, onClick: onNavigate, children: item.label }, item.to))) }));
export const MobileNavLinks = ({ navItems, onNavigate, }) => (_jsx(Stack, { as: "nav", spacing: 3, px: 4, children: navItems.map((item) => (_jsx(Button, { as: NavLink, to: item.to, justifyContent: "flex-start", variant: "ghost", onClick: onNavigate, children: item.label }, item.to))) }));
export const MobileToggle = ({ isOpen, onToggle }) => (_jsx(IconButton, { size: "md", "aria-label": "Toggle navigation", icon: isOpen ? _jsx(CloseIcon, {}) : _jsx(HamburgerIcon, {}), display: { base: 'flex', md: 'none' }, onClick: onToggle, variant: "ghost" }));
export const DesktopAuthActions = ({ isAuthenticated, profile, onLogout, }) => {
    const location = useLocation();
    if (isAuthenticated) {
        return _jsx(UserMenu, { profile: profile, onLogout: onLogout, currentPath: location.pathname });
    }
    return _jsx(GuestActions, {});
};
export const GuestActions = ({ onNavigate } = {}) => (_jsxs(HStack, { spacing: 3, children: [_jsx(Button, { as: RouterLink, to: "/login", variant: "ghost", colorScheme: "brand", size: "sm", onClick: onNavigate, children: "Login" }), _jsx(Button, { as: RouterLink, to: "/register", colorScheme: "brand", size: "sm", onClick: onNavigate, children: "Sign up" })] }));
export const UserMenu = ({ profile, onLogout, currentPath, }) => {
    const displayName = useMemo(() => profile?.full_name || profile?.email || 'Account', [profile]);
    return (_jsxs(Menu, { placement: "bottom-end", children: [_jsx(MenuButton, { as: Button, variant: "outline", size: "sm", leftIcon: _jsx(Avatar, { size: "xs", name: displayName }), children: _jsx(Text, { as: "span", noOfLines: 1, maxW: { base: '120px', md: '160px' }, children: displayName }) }), _jsxs(MenuList, { children: [_jsx(MenuItem, { as: RouterLink, to: "/dashboard", isDisabled: currentPath === '/dashboard', children: "Dashboard" }), _jsx(MenuItem, { as: RouterLink, to: "/submit", isDisabled: currentPath === '/submit', children: "Submit review" }), _jsx(MenuDivider, {}), _jsx(MenuItem, { onClick: onLogout, children: "Sign out" })] })] }));
};
