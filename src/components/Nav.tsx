import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

function Nav({
  currentNetwork,
  handleNetworkChange,
  children,
}: {
  currentNetwork: string;
  handleNetworkChange: () => void;
  children: React.ReactNode;
}) {
  const wallet = useWallet();
  const [shadowRadius, setShadowRadius] = useState(0);
  useEffect(() => {
    if (wallet.publicKey) {
      setShadowRadius(0);
      return;
    }
    const shadowBlinker = setInterval(() => {
      setShadowRadius((prev) => (prev === 0 ? 30 : 0));
    }, 500);

    return () => clearInterval(shadowBlinker);
  }, [wallet.publicKey]);
  return (
    <div className="flex justify-between fixed w-screen top-0 p-2 lg:px-7 lg:py-5 text-xl lg:text-3xl font-extrabold text-zinc-200">
      <p className="px-2 lg:py-3 lg:px-5">Solana Token Launchpad</p>
      <div className="flex items-center">
        <div className="mr-5">
          <button
            title="switch network"
            onClick={handleNetworkChange}
            className="border border-green-300/30 bg-green-300/20 text-green-300 px-3 py-1 rounded-lg text-lg cursor-pointer"
          >
            {currentNetwork}
          </button>
        </div>
        <div
          style={{
            boxShadow: `0px 0px ${shadowRadius}px 0px #b91c1c`,
          }}
          className={` h-fit rounded-xl transition-shadow duration-300 border-2 ${
            wallet.publicKey ? "border-neutral-700" : "border-red-700"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default Nav;
