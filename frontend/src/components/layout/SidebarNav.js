import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, Box, Button, Flex, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, NavLink } from 'react-router-dom';
import { Icon } from '@chakra-ui/react';
export const SidebarNav = ({ navItems, profile, isAuthenticated, onLogout }) => {
    const sidebarBg = useColorModeValue('white', 'gray.900');
    const borderColor = useColorModeValue('gray.100', 'gray.700');
    if (!navItems.length && !isAuthenticated) {
        return null;
    }
    return (_jsx(Box, { as: "aside", width: { base: '0', md: '64' }, display: { base: 'none', md: 'flex' }, flexShrink: 0, bg: sidebarBg, borderRightWidth: "1px", borderColor: borderColor, children: _jsxs(Flex, { direction: "column", w: "full", h: "full", px: 6, py: 8, gap: 8, children: [_jsx(Stack, { spacing: 1, children: navItems.map((item) => (_jsx(Button, { as: NavLink, to: item.to, justifyContent: "flex-start", variant: "ghost", leftIcon: _jsx(Icon, { as: item.icon, boxSize: 5 }), px: 4, py: 3, borderRadius: "lg", fontWeight: "medium", _activeLink: {
                            bg: 'brand.50',
                            color: 'brand.600',
                            fontWeight: 'semibold',
                        }, children: item.label }, item.to))) }), _jsx(Box, { mt: "auto", pt: 6, borderTopWidth: "1px", borderColor: borderColor, children: isAuthenticated ? (_jsx(AuthenticatedSidebar, { profile: profile, onLogout: onLogout })) : (_jsx(AnonymousSidebar, {})) })] }) }));
};
const AuthenticatedSidebar = ({ profile, onLogout, }) => (_jsxs(Stack, { spacing: 3, children: [_jsxs(Flex, { align: "center", gap: 3, children: [_jsx(Avatar, { size: "sm", name: profile?.full_name ?? profile?.email ?? 'Account' }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", children: profile?.full_name ?? 'Your workspace' }), profile?.email && (_jsx(Text, { fontSize: "xs", color: "gray.500", children: profile.email }))] })] }), _jsx(Button, { variant: "outline", colorScheme: "brand", size: "sm", onClick: onLogout, children: "Sign out" })] }));
const AnonymousSidebar = () => (_jsxs(Stack, { spacing: 2, children: [_jsx(Button, { as: RouterLink, to: "/login", colorScheme: "brand", size: "sm", children: "Login" }), _jsx(Button, { as: RouterLink, to: "/register", variant: "outline", size: "sm", children: "Create account" })] }));
