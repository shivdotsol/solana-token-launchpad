import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import Nav from "./components/Nav";
import TokenLaunchpad from "./components/TokenLaunchpad";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";
import { useEffect, useState } from "react";

function App() {
  const [RPC_URL, setRPC_URL] = useState(import.meta.env.VITE_MAINNET_RPC_URL);
  const [currentNetwork, setCurrentNetwork] = useState(
    localStorage.getItem("currentNetwork") ?? "Mainnet"
  );

  const handleNetworkChange = () => {
    if (currentNetwork === "Mainnet") {
      localStorage.setItem("currentNetwork", "Devnet");
      setCurrentNetwork("Devnet");
      setRPC_URL(import.meta.env.VITE_DEVNET_RPC_URL);
    } else {
      localStorage.setItem("currentNetwork", "Mainnet");
      setCurrentNetwork("Mainnet");
      setRPC_URL(import.meta.env.VITE_MAINNET_RPC_URL);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("currentNetwork") === "Devnet") {
      setRPC_URL(import.meta.env.VITE_DEVNET_RPC_URL);
    } else {
      localStorage.setItem("currentNetwork", "Mainnet");
      setRPC_URL(import.meta.env.VITE_MAINNET_RPC_URL);
    }
  }, []);

  return (
    <>
      <ConnectionProvider endpoint={RPC_URL}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="h-screen flex items-end lg:items-center justify-center bg-gradient-to-t from-zinc-800 to-zinc-950/95 text-zinc-100">
              <Nav
                handleNetworkChange={handleNetworkChange}
                currentNetwork={currentNetwork}
              >
                <WalletMultiButton
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "10px",
                  }}
                />
              </Nav>
              <TokenLaunchpad />
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
}

export default App;
