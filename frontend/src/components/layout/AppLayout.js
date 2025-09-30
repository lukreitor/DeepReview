import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Collapse, Container, Flex, HStack, Stack, useColorModeValue, useDisclosure, } from '@chakra-ui/react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuthStore } from '@store/authStore';
import { FiBarChart2, FiSend } from 'react-icons/fi';
import { useReviewStream } from '@features/reviews/api';
import { SidebarNav } from './SidebarNav';
import { BrandNavItems, DesktopAuthActions, GuestActions, MobileNavLinks, MobileToggle, } from './TopNavActions';
const NAV_ITEMS = [
    { label: 'Dashboard', to: '/dashboard', requiresAuth: true, icon: FiBarChart2 },
    { label: 'Submit review', to: '/submit', requiresAuth: false, icon: FiSend },
];
const getNavItems = (isAuthenticated) => NAV_ITEMS.filter((item) => (item.requiresAuth ? isAuthenticated : true));
export const AppLayout = () => {
    const { isOpen, onToggle, onClose } = useDisclosure();
    const token = useAuthStore((state) => state.token);
    const profile = useAuthStore((state) => state.profile);
    const logout = useAuthStore((state) => state.logout);
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
    return (_jsxs(Box, { minH: "100vh", bgGradient: "linear(to-b, gray.50, white)", children: [_jsxs(Box, { borderBottomWidth: "1px", borderColor: borderColor, bg: headerBg, position: "sticky", top: 0, zIndex: 10, children: [_jsx(Container, { maxW: "7xl", px: { base: 4, md: 6 }, children: _jsxs(Flex, { h: 16, align: "center", justify: "space-between", children: [_jsxs(HStack, { spacing: 6, align: "center", children: [_jsx(Button, { as: RouterLink, to: "/submit", variant: "ghost", fontSize: "lg", fontWeight: "bold", color: "brand.600", _hover: { bg: 'brand.50', color: 'brand.700' }, onClick: onClose, children: "DeepReview" }), _jsx(BrandNavItems, { navItems: navItems, onNavigate: onClose })] }), _jsxs(Flex, { align: "center", gap: 3, children: [_jsx(MobileToggle, { isOpen: isOpen, onToggle: onToggle }), _jsx(Box, { display: { base: 'none', md: 'block' }, children: _jsx(DesktopAuthActions, { isAuthenticated: isAuthenticated, profile: profile, onLogout: handleLogout }) })] })] }) }), _jsx(Collapse, { in: isOpen, animateOpacity: true, children: _jsx(Box, { pb: 4, display: { md: 'none' }, children: _jsxs(Stack, { spacing: 3, px: 4, children: [_jsx(MobileNavLinks, { navItems: navItems, onNavigate: onClose }), isAuthenticated ? (_jsx(Button, { variant: "outline", colorScheme: "brand", onClick: handleLogout, children: "Sign out" })) : (_jsx(GuestActions, { onNavigate: onClose }))] }) }) })] }), _jsxs(Flex, { as: "section", align: "stretch", minH: "calc(100vh - 4rem)", children: [_jsx(SidebarNav, { navItems: navItems, profile: profile, isAuthenticated: isAuthenticated, onLogout: handleLogout }), _jsx(Box, { as: "main", flex: "1", py: { base: 6, md: 10 }, px: { base: 4, md: 8 }, minW: 0, children: _jsx(Outlet, {}) })] })] }));
};
