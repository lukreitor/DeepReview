import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, Box, Button, Collapse, Container, Flex, HStack, Icon, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Stack, Text, useColorModeValue, useDisclosure, } from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuthStore } from '@store/authStore';
import { FiBarChart2, FiSend } from 'react-icons/fi';
import { useReviewStream } from '@features/reviews/api';
const NAV_ITEMS = [
    { label: 'Dashboard', to: '/dashboard', requiresAuth: true, icon: FiBarChart2 },
    { label: 'Submit review', to: '/submit', requiresAuth: false, icon: FiSend },
];
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
const getNavItems = (isAuthenticated) => NAV_ITEMS.filter((item) => (item.requiresAuth ? isAuthenticated : true));
export const AppLayout = () => {
    const { isOpen, onToggle, onClose } = useDisclosure();
    const token = useAuthStore((state) => state.token);
    const profile = useAuthStore((state) => state.profile);
    const logout = useAuthStore((state) => state.logout);
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
    return (_jsxs(Box, { minH: "100vh", bgGradient: "linear(to-b, gray.50, white)", children: [_jsxs(Box, { borderBottomWidth: "1px", borderColor: borderColor, bg: headerBg, position: "sticky", top: 0, zIndex: 10, children: [_jsx(Container, { maxW: "7xl", px: { base: 4, md: 6 }, children: _jsxs(Flex, { h: 16, align: "center", justify: "space-between", children: [_jsxs(HStack, { spacing: 6, align: "center", children: [_jsx(Button, { as: RouterLink, to: "/submit", variant: "ghost", fontSize: "lg", fontWeight: "bold", color: "brand.600", _hover: { bg: 'brand.50', color: 'brand.700' }, onClick: onClose, children: "DeepReview" }), _jsx(HStack, { spacing: 1, display: { base: 'none', md: 'flex' }, children: navItems.map((item) => (_jsx(NavButton, { to: item.to, label: item.label, onNavigate: onClose }, item.to))) })] }), _jsxs(Flex, { align: "center", gap: 3, children: [_jsx(IconButton, { size: "md", "aria-label": "Toggle navigation", icon: isOpen ? _jsx(CloseIcon, {}) : _jsx(HamburgerIcon, {}), display: { base: 'flex', md: 'none' }, onClick: onToggle, variant: "ghost" }), _jsx(Box, { display: { base: 'none', md: 'block' }, children: isAuthenticated ? (_jsx(UserMenu, { email: profile?.email, name: profile?.full_name, onLogout: handleLogout, currentPath: location.pathname })) : (_jsx(GuestActions, { onNavigate: onClose })) })] })] }) }), _jsx(Collapse, { in: isOpen, animateOpacity: true, children: _jsx(Box, { pb: 4, display: { md: 'none' }, children: _jsxs(Stack, { as: "nav", spacing: 3, px: 4, children: [navItems.map((item) => (_jsx(NavButton, { to: item.to, label: item.label, onNavigate: onClose }, item.to))), isAuthenticated ? (_jsx(Button, { variant: "outline", colorScheme: "brand", onClick: handleLogout, children: "Sign out" })) : (_jsxs(Stack, { spacing: 2, children: [_jsx(Button, { as: RouterLink, to: "/login", colorScheme: "brand", onClick: onClose, children: "Login" }), _jsx(Button, { as: RouterLink, to: "/register", variant: "outline", onClick: onClose, children: "Create account" })] }))] }) }) })] }), _jsxs(Flex, { as: "section", align: "stretch", minH: "calc(100vh - 4rem)", children: [_jsx(SidebarNav, { navItems: navItems, profile: profile, isAuthenticated: isAuthenticated, onLogout: handleLogout }), _jsx(Box, { as: "main", flex: "1", py: { base: 6, md: 10 }, px: { base: 4, md: 8 }, minW: 0, children: _jsx(Outlet, {}) })] })] }));
};
const SidebarNav = ({ navItems, profile, isAuthenticated, onLogout }) => {
    const sidebarBg = useColorModeValue('white', 'gray.900');
    const borderColor = useColorModeValue('gray.100', 'gray.700');
    if (!navItems.length && !isAuthenticated) {
        return null;
    }
    return (_jsx(Box, { as: "aside", width: { base: '0', md: '64' }, display: { base: 'none', md: 'flex' }, flexShrink: 0, bg: sidebarBg, borderRightWidth: "1px", borderColor: borderColor, children: _jsxs(Flex, { direction: "column", w: "full", h: "full", px: 6, py: 8, gap: 8, children: [_jsx(Stack, { spacing: 1, children: navItems.map((item) => (_jsx(Button, { as: NavLink, to: item.to, justifyContent: "flex-start", variant: "ghost", leftIcon: _jsx(Icon, { as: item.icon, boxSize: 5 }), px: 4, py: 3, borderRadius: "lg", fontWeight: "medium", _activeLink: {
                            bg: 'brand.50',
                            color: 'brand.600',
                            fontWeight: 'semibold',
                        }, children: item.label }, item.to))) }), _jsx(Box, { mt: "auto", pt: 6, borderTopWidth: "1px", borderColor: borderColor, children: isAuthenticated ? (_jsxs(Stack, { spacing: 3, children: [_jsxs(Flex, { align: "center", gap: 3, children: [_jsx(Avatar, { size: "sm", name: profile?.full_name ?? profile?.email ?? 'Account' }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", children: profile?.full_name ?? 'Your workspace' }), profile?.email && (_jsx(Text, { fontSize: "xs", color: "gray.500", children: profile.email }))] })] }), _jsx(Button, { variant: "outline", colorScheme: "brand", size: "sm", onClick: onLogout, children: "Sign out" })] })) : (_jsxs(Stack, { spacing: 2, children: [_jsx(Button, { as: RouterLink, to: "/login", colorScheme: "brand", size: "sm", children: "Login" }), _jsx(Button, { as: RouterLink, to: "/register", variant: "outline", size: "sm", children: "Create account" })] })) })] }) }));
};
const NavButton = ({ to, label, onNavigate, }) => {
    return (_jsx(Button, { as: NavLink, to: to, px: 4, size: "sm", ...inactiveStyles, _activeLink: activeStyles, onClick: onNavigate, children: label }));
};
const GuestActions = ({ onNavigate }) => (_jsxs(HStack, { spacing: 3, children: [_jsx(Button, { as: RouterLink, to: "/login", variant: "ghost", colorScheme: "brand", size: "sm", onClick: onNavigate, children: "Login" }), _jsx(Button, { as: RouterLink, to: "/register", colorScheme: "brand", size: "sm", onClick: onNavigate, children: "Sign up" })] }));
const UserMenu = ({ email, name, onLogout, currentPath, }) => {
    return (_jsxs(Menu, { placement: "bottom-end", children: [_jsx(MenuButton, { as: Button, variant: "outline", size: "sm", leftIcon: _jsx(Avatar, { size: "xs", name: name ?? email ?? 'User' }), children: _jsx(Text, { as: "span", noOfLines: 1, maxW: { base: '120px', md: '160px' }, children: name || email || 'Account' }) }), _jsxs(MenuList, { children: [_jsx(MenuItem, { as: RouterLink, to: "/dashboard", isDisabled: currentPath === '/dashboard', children: "Dashboard" }), _jsx(MenuItem, { as: RouterLink, to: "/submit", isDisabled: currentPath === '/submit', children: "Submit review" }), _jsx(MenuDivider, {}), _jsx(MenuItem, { onClick: onLogout, children: "Sign out" })] })] }));
};
