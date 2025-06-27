"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Divider,
} from "@chakra-ui/react";

type RiskWarningModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function RiskWarningModal({ isOpen, onClose }: RiskWarningModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent mx={4}>
        <ModalHeader borderBottomWidth="1px" textAlign="center">
          ⚠️ Important Risk Warning ⚠️
        </ModalHeader>
        <ModalBody py={6}>
          <Text fontSize="md" lineHeight="tall" textAlign="center">
            Cryptocurrency investments carry a high risk of volatility. Be aware
            of the tax implications, as profits may be subject to capital gains
            or other taxes in your jurisdiction. Cryptocurrency regulations can
            vary, so ensure you understand the rules in your area. Perform
            market research and invest only what you can afford to lose.
          </Text>
        </ModalBody>
        <ModalFooter borderTopWidth="1px">
          <Button colorScheme="brand" onClick={onClose} width="full">
            I Understand
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
