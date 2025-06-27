"use client";

import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Image,
  Link,
  Button,
  Flex,
} from "@chakra-ui/react";
import { formatEther } from "ethers";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

type HistoryItem = {
  from: {
    ens_domain_name: string | null;
    hash: string;
  };
  to: {
    ens_domain_name: string | null;
    hash: string;
  };
  timestamp: string;
  price: string;
  total: {
    token_id: string;
    token_instance: {
      image_url: string;
      metadata: {
        name: string;
      };
    };
  };
};

const isZNSContract = (address: string) => {
  return (
    address.toLowerCase() ===
    "0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5".toLowerCase()
  );
};

export function HistoryGrid() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerPage] = useState<number>(10);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const params = useParams();
  const contractAddress = params.contractAddress as string;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        console.log("Fetching history for contract:", contractAddress);
        if (!contractAddress) {
          console.error("No contract address provided");
          return;
        }

        const formattedAddress = contractAddress.toLowerCase();

        const url = `https://weycliznaagngmzpancf.supabase.co/storage/v1/object/public/market_trades/${formattedAddress}.json`;
        console.log("Fetching from URL:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Response status:", response.status);
          console.error("Response status text:", response.statusText);
          throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received data:", data);

        if (!data || !Array.isArray(data.data)) {
          console.error("Invalid data format received:", data);
          setHistory([]);
          return;
        }

        setHistory(data.data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (contractAddress) {
      fetchHistory();
    } else {
      console.error("No contract address available in params");
      setIsLoading(false);
    }
  }, [contractAddress]);

  const totalItems = history.length;
  const numberOfPages = Math.ceil(totalItems / itemsPerPage);

  const currentPageItems = useMemo(() => {
    const start = currentPageIndex * itemsPerPage;
    const end = start + itemsPerPage;
    return history.slice(start, end);
  }, [history, currentPageIndex, itemsPerPage]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
        width="100%"
      >
        <Text fontSize="lg" color="gray.500">
          Loading history...
        </Text>
      </Box>
    );
  }

  if (!history.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
        width="100%"
      >
        <Text fontSize="lg" color="gray.500">
          No transaction history found
        </Text>
      </Box>
    );
  }

  return (
    <Box width="100%">
      <Box overflowX="auto" width="100%">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Item</Th>
              <Th>Price</Th>
              <Th display={{ base: "none", md: "table-cell" }}>From</Th>
              <Th display={{ base: "none", md: "table-cell" }}>To</Th>
              <Th>Time</Th>
            </Tr>
          </Thead>
          <Tbody>
            {currentPageItems.map((item, index) => {
              const isZNS = isZNSContract(contractAddress);
              const imageUrl = isZNS
                ? "/zns/zns.webp"
                : item.total.token_instance.image_url ||
                  item.total.token_instance.metadata?.name;
              const name = isZNS
                ? `${
                    item.total.token_instance.metadata?.name ||
                    `#${item.total.token_id}`
                  }`
                : item.total.token_instance.metadata?.name ||
                  `#${item.total.token_id}`;

              return (
                <Tr key={index}>
                  <Td minWidth={{ base: "150px", md: "auto" }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={3}
                      flexWrap={{ base: "wrap", md: "nowrap" }}
                    >
                      <Link
                        href={`/collection/57073/${contractAddress.toLowerCase()}/token/${
                          item.total.token_id
                        }`}
                        _hover={{ transform: "scale(1.05)" }}
                        transition="all 0.2s"
                        minWidth={{ base: "40px", md: "auto" }}
                        height={{ base: "40px", md: "auto" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Image
                          src={imageUrl}
                          alt={name}
                          boxSize={{ base: "35px", md: "40px" }}
                          objectFit="cover"
                          borderRadius="md"
                          cursor="pointer"
                        />
                      </Link>

                      <Text
                        fontSize={{ base: "sm", md: "md" }}
                        isTruncated
                        maxWidth={{ base: "100px", md: "150px" }}
                      >
                        {name}
                      </Text>
                    </Box>
                  </Td>
                  <Td>
                    <Text fontSize={{ base: "sm", md: "md" }}>
                      {formatEther(item.price)} ETH
                    </Text>
                  </Td>
                  <Td display={{ base: "none", md: "table-cell" }}>
                    <Link href={`/profile/${item.from.hash}`} color="blue.500">
                      {item.from.ens_domain_name ||
                        item.from.hash.slice(0, 6) + "..."}
                    </Link>
                  </Td>
                  <Td display={{ base: "none", md: "table-cell" }}>
                    <Link href={`/profile/${item.to.hash}`} color="blue.500">
                      {item.to.ens_domain_name ||
                        item.to.hash.slice(0, 6) + "..."}
                    </Link>
                  </Td>
                  <Td>
                    <Text fontSize={{ base: "sm", md: "md" }}>
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                      })}
                    </Text>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {numberOfPages > 1 && (
        <Box
          mx="auto"
          maxW={{ base: "90vw", lg: "700px" }}
          mt="20px"
          px="10px"
          py="5px"
          overflowX="auto"
        >
          <Flex direction="row" justifyContent="center" gap="3">
            <Button
              onClick={() => setCurrentPageIndex(0)}
              isDisabled={currentPageIndex === 0}
            >
              <MdKeyboardDoubleArrowLeft />
            </Button>
            <Button
              isDisabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
            >
              <RiArrowLeftSLine />
            </Button>
            <Text my="auto">
              Strona {currentPageIndex + 1} z {numberOfPages}
            </Text>
            <Button
              isDisabled={currentPageIndex === numberOfPages - 1}
              onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
            >
              <RiArrowRightSLine />
            </Button>
            <Button
              onClick={() => setCurrentPageIndex(numberOfPages - 1)}
              isDisabled={currentPageIndex === numberOfPages - 1}
            >
              <MdKeyboardDoubleArrowRight />
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
