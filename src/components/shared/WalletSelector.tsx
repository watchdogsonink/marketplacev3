import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Image,
  Text,
} from "@chakra-ui/react";

const WALLET_ICONS: Record<string, string> = {
  MetaMask: "/images/wallets/metamask.svg",
  Rabby: "/images/wallets/rabby.svg",
  "Trust Wallet": "/images/wallets/trustwallet.svg",
  Coinbase: "/images/wallets/coinbase.svg",
  OKX: "/images/wallets/okx.svg",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wallets: { name: string; id: string }[];
  onSelect: (walletId: string) => void;
}

export function WalletSelector({ isOpen, onClose, wallets, onSelect }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader>Choose wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {wallets.map((wallet) => (
              <Button
                key={wallet.id}
                w="full"
                variant="outline"
                onClick={() => {
                  onSelect(wallet.id);
                  onClose();
                }}
                h="auto"
                p={4}
              >
                <HStack spacing={4} w="full">
                  <Image
                    src={
                      WALLET_ICONS[wallet.name] || "/images/wallets/default.svg"
                    }
                    alt={wallet.name}
                    boxSize="32px"
                    objectFit="contain"
                  />
                  <Text>{wallet.name}</Text>
                </HStack>
              </Button>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
