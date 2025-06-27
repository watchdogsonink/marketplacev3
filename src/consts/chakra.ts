import { extendTheme, ThemeConfig } from "@chakra-ui/react";

export const chakraThemeConfig: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const chakraTheme = extendTheme({
  config: chakraThemeConfig,
  colors: {
    brand: {
      50: "#f5e9ff",
      100: "#dbc1ff",
      200: "#c199ff",
      300: "#a770ff",
      400: "#8d48ff",
      500: "#742fff", // Primary brand color
      600: "#5a24cc",
      700: "#411a99",
      800: "#291066",
      900: "#120633",
    },
    ink: {
      primary: "#5848d5", // Primary color for INK Network
      secondary: "#4838b5",
      accent: "#7868f5",
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.900" : "gray.50",
      },
    }),
  },
});
