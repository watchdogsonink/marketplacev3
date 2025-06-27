import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  Image,
  Heading,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
  nftImage?: string;
}

export function PurchaseSuccessModal({
  isOpen,
  onClose,
  collectionName,
  nftImage,
}: Props) {
  const router = useRouter();

  const handleConfirm = () => {
    onClose();
    router.refresh();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader textAlign="center">
          <Heading
            size="lg"
            bgGradient="linear(to-r, brand.500, ink.accent)"
            bgClip="text"
          >
            Congratulations!
          </Heading>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={6} align="center" py={4}>
            {nftImage && (
              <Image
                src={nftImage}
                alt="Purchased NFT"
                borderRadius="xl"
                maxW="200px"
              />
            )}
            <Text fontSize="xl" textAlign="center">
              You have successfully purchased an NFT from collection
              <Text
                as="span"
                fontWeight="bold"
                bgGradient="linear(to-r, brand.500, ink.accent)"
                bgClip="text"
                ml={2}
              >
                {collectionName}
              </Text>
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button onClick={handleConfirm} colorScheme="green" size="lg">
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
