import type { Metadata } from "next";
import { Providers } from "@/components/shared/Providers";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Box, Flex } from "@chakra-ui/react";

export const metadata: Metadata = {
  title: "INK NFT Marketplace",
  description: "Discover, collect, and sell NFTs on INK Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh" }}>
        <Providers>
          <Box minH="100vh" display="flex" flexDirection="column">
            <Navbar />
            <Box flex="1" mt="72px">
              {children}
            </Box>
            <Footer />
          </Box>
        </Providers>
      </body>
    </html>
  );
}
