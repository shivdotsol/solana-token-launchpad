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
      <ConnectionProvider endpoint="https://solana-devnet.g.alchemy.com/v2/1Gc10b6c3_nM4Wk-Im50fmCtKwky6elD">
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="h-screen flex items-center justify-center bg-gradient-to-t from-zinc-800 to-zinc-950/95 text-zinc-100">
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
