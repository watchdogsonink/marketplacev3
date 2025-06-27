import { useState, useEffect } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<
    { name: string; id: string }[]
  >([]);

  // Check wallet availability
  const checkWalletAvailability = () => {
    if (typeof window === "undefined") return false;
    return !!window.ethereum;
  };

  // Check available wallets
  useEffect(() => {
    const checkAvailableWallets = () => {
      const wallets = [];

      if (window.ethereum?.isMetaMask) {
        wallets.push({ name: "MetaMask", id: "metamask" });
      }

      if (window.ethereum?.isRabby) {
        wallets.push({ name: "Rabby", id: "rabby" });
      }

      if (window.ethereum?.isTrust) {
        wallets.push({ name: "Trust Wallet", id: "trust" });
      }

      if (window.ethereum?.isCoinbaseWallet) {
        wallets.push({ name: "Coinbase", id: "coinbase" });
      }

      setAvailableWallets(wallets);
    };

    checkAvailableWallets();
  }, []);

  useEffect(() => {
    if (checkWalletAvailability()) {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(_provider);

      // Check connected accounts
      _provider
        .send("eth_accounts", [])
        .then((accounts: string[]) => {
          if (accounts?.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .catch(console.error);

      // Define event handlers
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsPending(false);
        } else {
          setAccount(null);
          setIsPending(false);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      // Add event listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Cleanup
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const showToast = (message: string) => {
    // Function to display toast notifications
    if (typeof window !== "undefined") {
      const event = new CustomEvent("showWalletToast", {
        detail: { message },
      });
      window.dispatchEvent(event);
    }
  };

  const connectWallet = async () => {
    if (!checkWalletAvailability()) {
      window.open("https://ethereum.org/en/wallets/find-wallet/", "_blank");
      return;
    }

    if (account) {
      return; // If already connected, just exit
    }

    if (isPending) {
      showToast("Connection request is already active. Check your wallet");
      return;
    }

    try {
      setIsPending(true);

      if (!provider) {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(_provider);
      }

      const accounts = await window.ethereum
        .request({
          method: "eth_requestAccounts",
          params: [],
        })
        .catch((error: any) => {
          if (error.code === 4001) {
            showToast("Connection rejected by user");
            return null;
          } else if (error.code === -32002) {
            showToast(
              "Connection request is already active. Check your wallet"
            );
            return null;
          }
          showToast(error.message || "An unknown error occurred");
          return null;
        });

      if (!accounts) return;

      if (accounts.length > 0) {
        // Check balance before setting account
        try {
          const balance = await provider?.getBalance(accounts[0]);
          if (balance && balance <= 0n) {
            showToast(
              "Your wallet has no funds. Top it up to perform transactions."
            );
          }
        } catch (error) {
          console.error("Error checking balance:", error);
        }

        setAccount(accounts[0]);

        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        if (chainId !== "0xDEF1") {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xDEF1" }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: "0xDEF1",
                      chainName: "INK Network",
                      nativeCurrency: {
                        name: "ETH",
                        symbol: "ETH",
                        decimals: 18,
                      },
                      rpcUrls: ["process.env.ALCHEMY_KEY"],
                      blockExplorerUrls: ["https://explorer.inkonchain.com"],
                    },
                  ],
                });
              } catch (addError: any) {
                showToast("Failed to add INK Network");
                return;
              }
            } else if (switchError.code === 4001) {
              showToast("Network change rejected by user");
              return;
            } else {
              showToast("Failed to switch network");
              return;
            }
          }
        }
      } else {
        showToast("No account selected");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      // Check if error is related to insufficient funds
      if (
        error.code === "INSUFFICIENT_FUNDS" ||
        error.code === -32000 ||
        (error.message && error.message.includes("insufficient funds"))
      ) {
        showToast(
          "Insufficient funds in wallet. Top up your wallet to perform transactions."
        );
      } else {
        showToast(error.message || "An unknown error occurred");
      }
    } finally {
      setIsPending(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setIsPending(false);
  };

  return {
    account,
    connectWallet,
    disconnectWallet,
    provider,
    isConnected: !!account,
    hasWallet: checkWalletAvailability(),
    isPending,
    availableWallets,
  };
}
