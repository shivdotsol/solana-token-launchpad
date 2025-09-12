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

function App() {
  return (
    <>
      <ConnectionProvider endpoint={import.meta.env.VITE_RPC_URL}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="h-screen flex items-end lg:items-center justify-center bg-gradient-to-t from-zinc-800 to-zinc-950/95 text-zinc-100">
              <Nav>
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
