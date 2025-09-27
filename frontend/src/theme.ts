import { extendTheme, type ComponentStyleConfig, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#eef2ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  accent: {
    50: '#fef3f2',
    100: '#fde4e1',
    200: '#fccfc8',
    300: '#f8a69b',
    400: '#f37f72',
    500: '#ef5f52',
    600: '#dc3f33',
    700: '#b8372d',
    800: '#962c25',
    900: '#7b241f',
  },
};

const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
  },
};

const buttonStyles: ComponentStyleConfig = {
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'lg',
  },
  variants: {
    solid: (props) => ({
      bg: `${props.colorScheme ?? 'brand'}.500`,
      color: 'white',
      _hover: { bg: `${props.colorScheme ?? 'brand'}.600` },
      _active: { bg: `${props.colorScheme ?? 'brand'}.700` },
    }),
  },
  defaultProps: {
    colorScheme: 'brand',
  },
};

const badgeStyles: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: 'md',
    textTransform: 'none',
    fontWeight: 'semibold',
  },
};

const components = {
  Button: buttonStyles,
  Badge: badgeStyles,
};

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
});

export default theme;
