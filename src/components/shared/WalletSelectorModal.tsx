import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  VStack,
  Button,
  Image,
  Text,
} from "@chakra-ui/react";

const WALLETS = [
  {
    name: "MetaMask",
    icon: "/images/metamask.svg",
    url: "https://metamask.io/download/",
  },
  {
    name: "Rabby",
    icon: "/images/rabby.svg",
    url: "https://rabby.io/",
  },
  {
    name: "Trust Wallet",
    icon: "/images/trustwallet.svg",
    url: "https://trustwallet.com/download",
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSelectorModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Choose wallet</ModalHeader>
        <ModalBody>
          <VStack spacing={4} pb={4}>
            {WALLETS.map((wallet) => (
              <Button
                key={wallet.name}
                w="full"
                onClick={() => window.open(wallet.url, "_blank")}
                leftIcon={<Image src={wallet.icon} boxSize="24px" />}
                justifyContent="flex-start"
              >
                <Text>{wallet.name}</Text>
              </Button>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
