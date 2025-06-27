// /market/src/components/token-page/CancelListingButton.tsx
import { Button, useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { MARKETPLACE_ADDRESS } from "@/consts/addresses";
import MarketplaceABI from "@/abis/MarketplaceABI.json";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useState } from "react";

type Props = {
  listingId: bigint;
  onSuccess?: () => void;
  w?: string;
  size?: string;
  h?: string;
};

export default function CancelListingButton(props: Props) {
  const [isCancelling, setIsCancelling] = useState(false);
  const { account, provider } = useWallet();
  const { refetchAllListings } = useMarketplaceContext();
  const toast = useToast();

  const cancelListing = async () => {
    if (!provider || !account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        isClosable: true,
        duration: 2000,
      });
      return;
    }
    try {
      const loadingToast = toast({
        title: "Cancelling...",
        status: "loading",
        duration: null,
      });

      const signer = await provider.getSigner();
      const marketplaceInstance = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MarketplaceABI,
        signer
      );

      const tx = await marketplaceInstance.cancelListing(props.listingId);

      // refetchAllListings();
      props.onSuccess?.();

      toast.close(loadingToast);

      toast({
        title: "Cancelled successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error cancelling listing:", error);
      toast({
        title: "Error",
        description: error.message || "Unknown error",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Button
      colorScheme="red"
      onClick={cancelListing}
      isLoading={isCancelling}
      loadingText="Cancelling..."
      w={props.w}
      size="md"
      h="40px"
      fontSize="md"
      fontWeight="semibold"
      px={6}
    >
      Cancel
    </Button>
  );
}
