import {
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMint2Instruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getMintLen,
  LENGTH_SIZE,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { Upload } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { uploadMetadataToIPFS, type MetadataObject } from "../libs/utils";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

function TokenLaunchpad() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenImageFile, setTokenImageFile] = useState<File | null>();
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenSupply, setTokenSupply] = useState<number>();
  const [tokenDecimals, setTokenDecimals] = useState<number>();
  const [status, setStatus] = useState("");

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTokenImageFile(e.target.files[0]);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet || !wallet.publicKey) {
      setStatus("wallet not connected");
      throw new Error("wallet not found");
    }
    if (!tokenImageFile) {
      setStatus("Token image not found");
      throw new Error("no image found");
    }

    const tokenMetadata: MetadataObject = {
      name: tokenName,
      symbol: tokenSymbol,
      image: "", // this will be set inside the uploadMetadataToIPFS() function
      description: tokenDescription,
    };

    const uploadRes = await uploadMetadataToIPFS({
      publicKey: wallet.publicKey!.toString(),
      metadata: tokenMetadata,
      imageFile: tokenImageFile,
    });
    if (!uploadRes.cid) {
      setStatus(uploadRes.message);
      return;
    }
    const metadataUri = `https://ipfs.io/ipfs/${uploadRes.cid}`;

    //////////////////////////////////////////////////////////////////

    const mintKeypair = Keypair.generate();
    const metadata = {
      mint: mintKeypair.publicKey,
      name: tokenName,
      symbol: tokenSymbol,
      uri: metadataUri,
      additionalMetadata: [],
    };
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        wallet.publicKey,
        wallet.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        tokenDecimals!,
        wallet.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintKeypair.publicKey,
        metadata: mintKeypair.publicKey,
        name: tokenName,
        symbol: tokenSymbol,
        uri: metadataUri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      })
    );

    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.partialSign(mintKeypair);
    await wallet.sendTransaction(transaction, connection);

    /////////////////////////////////////////////////////////////

    // minting to user's ATA

    const associatedTokenAddress = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    console.log("ATA: " + associatedTokenAddress.toBase58());
    const transaction2 = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAddress,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );

    await wallet.sendTransaction(transaction2, connection);

    const transaction3 = new Transaction().add(
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAddress,
        wallet.publicKey,
        tokenSupply!,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    await wallet.sendTransaction(transaction3, connection);
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
      {status && (
        <div className="px-5 py-2 bg-zinc-700 rounded-lg font-bold">
          {status}
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

        <label htmlFor="description">Token description</label>
        <input
          className="mb-5 px-4 py-2 bg-zinc-800 rounded-lg"
          type="text"
          id="description"
          placeholder="Describe your token briefly (max 150 characters)"
          value={tokenDescription}
          onChange={(e) => setTokenDescription(e.target.value)}
          maxLength={150}
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

        <label htmlFor="decimals">Decimals</label>
        <input
          className="mb-5 px-4 py-2 bg-zinc-800 rounded-lg"
          type="number"
          id="decimals"
          placeholder="0-9 (9 common, 6 stable coins, 0 NFTs)"
          value={tokenDecimals}
          onChange={(e) => setTokenDecimals(Number(e.target.value))}
          required
          min={0}
          max={9}
        />

        <label>Token image</label>
        <div className="relative">
          <label
            htmlFor="imageFile"
            className="py-5 cursor-pointer rounded-lg flex items-center justify-center bg-zinc-800 hover:bg-zinc-800/80 transition-all duration-150"
          >
            <span className="font-bold">
              {tokenImageFile?.name ? "Selected image : " : <Upload />}
            </span>
            <span className="ml-2 px-3 py-1 rounded-md bg-zinc-700">
              {tokenImageFile?.name || "Upload image"}
            </span>
          </label>
          <input
            className="absolute inset-1/3 opacity-0"
            type="file"
            id="imageFile"
            onChange={handleImageFileChange}
            required
          />
        </div>
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
