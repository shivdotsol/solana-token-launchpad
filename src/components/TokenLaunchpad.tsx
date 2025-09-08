import {
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useState } from "react";

function TokenLaunchpad() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenImageUrl, setTokenImageUrl] = useState("");
  const [tokenSupply, setTokenSupply] = useState<number>();
  const [tokenDecimals, setTokenDecimals] = useState<number>();

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet) throw new Error("wallet not found");

    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const keyPair = Keypair.generate();
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey!,
        newAccountPubkey: keyPair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMint2Instruction(
        keyPair.publicKey,
        tokenDecimals!,
        wallet.publicKey!,
        wallet.publicKey,
        TOKEN_PROGRAM_ID
      )
    );
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = wallet.publicKey!;
    transaction.partialSign(keyPair);
    wallet.sendTransaction(transaction, connection);
  };
  return (
    <div className="relative w-[90vw] md:w-[50vw] lg:w-[30vw] px-10 pt-7 pb-10 flex flex-col rounded-xl border border-zinc-700 bg-zinc-950">
      {!wallet.publicKey && (
        <div className="absolute inset-[1%] h-[98%] w-[98%] backdrop-blur-sm rounded-2xl flex items-center justify-center font-extrabold text-2xl">
          <div className="flex px-10 py-5 border rounded-2xl border-red-700 backdrop-blur-xl bg-red-500/15">
            <p>Connect your wallet</p>
            <img src="/arrow-tr.png" className="w-8 h-8 ml-3" />
          </div>
        </div>
      )}
      <div className="text-2xl font-bold mb-8">Token details</div>
      <form className="flex flex-col gap-y-3" onSubmit={handleCreateToken}>
        <label htmlFor="name">Token name</label>
        <input
          className="mb-5 px-4 py-2 bg-zinc-800 rounded-lg"
          type="text"
          id="name"
          placeholder="name of your token"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          required
        />

        <label htmlFor="symbol">Token symbol</label>
        <input
          className="mb-5 px-4 py-2 bg-zinc-800 rounded-lg"
          type="text"
          id="symbol"
          placeholder="symbol of your token"
          value={tokenSymbol}
          onChange={(e) => setTokenSymbol(e.target.value)}
          required
        />

        <label htmlFor="initialSupply">Initial supply</label>
        <input
          className="mb-5 px-4 py-2 bg-zinc-800 rounded-lg"
          type="number"
          id="initialSupply"
          placeholder="100"
          value={tokenSupply}
          onChange={(e) => setTokenSupply(Number(e.target.value))}
          required
          min={1}
        />

        <label htmlFor="initialSupply">Decimals</label>
        <input
          className="mb-5 px-4 py-2 bg-zinc-800 rounded-lg"
          type="number"
          id="initialSupply"
          placeholder="0-9 (9 common, 6 stable coins, 0 NFTs)"
          value={tokenDecimals}
          onChange={(e) => setTokenDecimals(Number(e.target.value))}
          required
          min={0}
          max={9}
        />

        <label htmlFor="imageUrl">Token image url</label>
        <input
          className="mb-5 px-4 py-2 bg-zinc-800 rounded-lg"
          type="text"
          id="imageUrl"
          placeholder="image url"
          value={tokenImageUrl}
          onChange={(e) => setTokenImageUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-zinc-300/95 mt-5 hover:bg-zinc-400 cursor-pointer active:scale-[98%] 
      transition-all duration-150 py-2 text-zinc-950 font-bold text-lg rounded-lg "
        >
          Create token
        </button>
      </form>
    </div>
  );
}

export default TokenLaunchpad;
