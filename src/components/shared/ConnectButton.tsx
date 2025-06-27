import { Button, useToast } from "@chakra-ui/react";
import { useWallet } from "@/hooks/useWallet";
import { useState, useEffect } from "react";

export function ConnectButton() {
  const { connectWallet, hasWallet, isPending } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isPending) {
      setIsConnecting(false);
    }
  }, [isPending]);

  // Handle toast events
  useEffect(() => {
    const handleWalletToast = (event: any) => {
      toast({
        title: "Informacja",
        description: event.detail.message,
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    };

    window.addEventListener("showWalletToast", handleWalletToast);
    return () => {
      window.removeEventListener("showWalletToast", handleWalletToast);
    };
  }, [toast]);

  const handleConnect = async () => {
    if (!hasWallet) {
      window.open("https://ethereum.org/en/wallets/find-wallet/", "_blank");
      return;
    }

    if (isConnecting || isPending) {
      return;
    }

    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error: any) {
      console.error("Connection error:", error);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      bgGradient="linear(to-r, #7928CA, rgb(235, 165, 231))"
      color="white"
      _hover={{
        bgGradient: "linear(to-r, rgb(235, 165, 231), #7928CA)",
        transform: "scale(1.05)",
      }}
      transition="all 0.3s"
      isLoading={isConnecting || isPending}
      loadingText="Connecting..."
      disabled={isConnecting || isPending}
    >
      {hasWallet ? "Connect Wallet" : "Install Wallet"}
    </Button>
  );
}
