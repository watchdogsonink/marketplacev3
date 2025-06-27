import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  VStack,
  Text,
  useToast,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";
import NFTABI from "@/abis/NFTABI.json";
import { useENS } from "@/hooks/useENS";

type Props = {
  contractAddress: string;
  tokenId: string | number;
  onSuccess?: () => void;
};

export default function TransferNFTButton({
  contractAddress,
  tokenId,
  onSuccess,
}: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { provider, account } = useWallet();
  const toast = useToast();
  const { ensName } = useENS(recipientAddress);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen();
  };

  const handleTransfer = async () => {
    if (!provider || !account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(contractAddress, NFTABI, signer);

      const loadingToast = toast({
        title: "Transferring NFT...",
        description: "Please wait",
        status: "loading",
        duration: 5000,
      });

      const tx = await nftContract.transferFrom(
        account,
        recipientAddress,
        tokenId
      );

      toast.close(loadingToast);
      toast({
        title: "Transfer initiated",
        description: "Transaction sent to blockchain",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      tx.wait()
        .then((receipt: any) => {
          if (receipt.status === 1) {
            toast({
              title: "Transfer successful",
              description: "Your NFT has been transferred",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
            onSuccess?.();
            onClose();
          } else {
            toast({
              title: "Transfer failed",
              description: "Transaction was rejected by the blockchain",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        })
        .catch((error: any) => {
          console.error("Transfer error:", error);
        });
    } catch (error: any) {
      console.error("Transfer error:", error);

      if (error.code === 4001 || error.message?.includes("user rejected")) {
        toast({
          title: "Transfer cancelled",
          description: "You cancelled the transfer",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Transfer failed",
          description:
            error.message || "An error occurred while transferring the NFT",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        colorScheme="blue"
        variant="outline"
        onClick={handleButtonClick}
        height="24px"
        fontSize="xs"
      >
        Transfer
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transfer NFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Recipient Address or ENS</FormLabel>
                <Input
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </FormControl>
              {ensName &&
                recipientAddress.toLowerCase() !== ensName.toLowerCase() && (
                  <Text fontSize="sm" color="green.500">
                    Resolved to: {ensName}
                  </Text>
                )}
              <Text fontSize="sm" color="gray.500">
                Please verify the address carefully. Transfers cannot be undone.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleTransfer}
              isLoading={isLoading}
              loadingText="Transferring..."
            >
              Transfer NFT
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
