import { ExternalLink } from "lucide-react";

function FinalModal({
  tokenName,
  tokenSymbol,
  tokenMint,
  tokenImageUri,
}: {
  tokenName: string;
  tokenSymbol: string;
  tokenMint: string;
  tokenImageUri: string;
}) {
  const network = localStorage.getItem("currentNetwork");
  const explorerUrl = `https://explorer.solana.com/address/${tokenMint}${
    network === "Devnet" ? "?cluster=devnet" : ""
  }`;
  return (
    <div className="w-[90vw] md:w-[35vw] border border-zinc-600 bg-zinc-800 px-8 py-6 flex flex-col gap-y-3 rounded-xl">
      <div className="flex items-center">
        <img
          className="w-16 md:w-20 h-16 md:h-20 rounded-[100px] mr-5"
          src={tokenImageUri}
          alt="token image"
        />
        <div className="flex flex-col">
          <div className="text-2xl font-semibold flex">
            <div>{tokenName}</div>
            <a href={explorerUrl} target="_blank">
              <div className="ml-3 flex px-2 py-1 rounded-lg bg-green-300/15 items-center">
                <div className="text-[#86efac] text-base">Explore</div>
                <div>
                  {" "}
                  <ExternalLink color="#86efac" size={20} />
                </div>
              </div>
            </a>
          </div>
          <div className="text-neutral-300/80 text-2xl font-bold">
            {tokenSymbol}
          </div>
        </div>
      </div>
      <div className="flex px-3 py-2 bg-zinc-700 rounded-lg mt-5">
        <p className="font-bold mr-2">Token mint:</p>
        <p className="font-bold">{tokenMint}</p>
      </div>
      <div className="flex px-3 py-2 bg-green-300/20 rounded-lg text-green-400">
        <p className="font-bold mr-2">Token has been sent to your wallet!</p>
      </div>
    </div>
  );
}

export default FinalModal;
