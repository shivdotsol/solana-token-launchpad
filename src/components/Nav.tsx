import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

function Nav({ children }: { children: React.ReactNode }) {
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
  );
}

export default Nav;
