import {
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMintLen,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { uploadMetadataToIPFS, type MetadataObject } from "../libs/utils";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import { ClipLoader } from "react-spinners";
import FinalModal from "./FinalModal";

function TokenLaunchpad() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenImageFile, setTokenImageFile] = useState<File | null>();
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenSupply, setTokenSupply] = useState<number>();
  const [tokenDecimals, setTokenDecimals] = useState<number>();
  const [tokenMint, setTokenMint] = useState("");
  const [tokenImageUri, setTokenImageUri] = useState("");
  const [preview, setPreview] = useState<string | null>();
  const [status, setStatus] = useState("");
  const [isFinalModalVisible, setIsFinalModalVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreview(null);
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 2 * 1024 * 1024) {
        alert("Image has to be under 2 mb.");
        e.target.value = "";
        return;
      }
      setTokenImageFile(e.target.files[0]);
      const ObjectUrl = URL.createObjectURL(e.target.files[0]);
      setPreview(ObjectUrl);
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

    alert("Your wallet will prompt you for 3 transactions.");
    setStatus("Initiating...");

    const tokenMetadata: MetadataObject = {
      name: tokenName,
      symbol: tokenSymbol,
      description: tokenDescription,
      image: "", // this will be set inside the uploadMetadataToIPFS() function
      properties: {
        files: [
          {
            uri: "", // this too
            type: "", // this too
          },
        ],
      },
    };

    setStatus("Uploading metadata to IPFS...");

    const uploadRes = await uploadMetadataToIPFS({
      publicKey: wallet.publicKey!.toString(),
      metadata: tokenMetadata,
      imageFile: tokenImageFile,
    });
    if (!uploadRes.cid || !uploadRes.metadata) {
      setStatus(uploadRes.message);
      return;
    }
    setTokenImageUri(uploadRes.metadata.image);
    const metadataUri = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${
      uploadRes.cid
    }`;
    // console.log(metadataUri);

    //////////////////////////////////////////////////////////////////

    setStatus("Generating token...");

    const mintKeypair = Keypair.generate();
    setTokenMint(mintKeypair.publicKey.toString());
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
        mintKeypair.publicKey,
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

    setStatus("Minting the token to ATA...");

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
    setStatus("Almost done.");
    await wallet.sendTransaction(transaction3, connection);
    setStatus("Done.");
    setIsFinalModalVisible(true);
  };

  return (
    <div className="relative w-screen lg:w-[60vw] px-7 pb-7 pt-5 lg:px-10 lg:pt-7 lg:pb-10 flex flex-col rounded-xl border border-zinc-700 bg-zinc-950">
      {!wallet.publicKey && (
        <div className="absolute z-10 inset-[1%] h-[98%] w-[98%] backdrop-blur-sm rounded-2xl flex items-center justify-center font-extrabold text-2xl">
          <div className="flex px-10 py-5 border rounded-2xl border-red-700 backdrop-blur-xl bg-red-500/15">
            <p>Connect your wallet</p>
            <img src="/arrow-tr.png" className="w-8 h-8 ml-3" />
          </div>
        </div>
      )}
      {isFinalModalVisible && (
        <div className="z-10 absolute inset-[1%] h-[98%] w-[98%] backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <FinalModal
            tokenName={tokenName}
            tokenSymbol={tokenSymbol}
            tokenMint={tokenMint}
            tokenImageUri={tokenImageUri}
          />
        </div>
      )}

      {status && !isFinalModalVisible && (
        <div className="flex justify-between text-base md:text-lg px-5 py-3 bg-green-300/15 font-extrabold mb-3 rounded-lg border border-neutral-500 text-green-300">
          <div>{`Status: ${status}`}</div>
          <ClipLoader
            color="#86efac"
            size={30}
            cssOverride={{
              borderWidth: "3px",
            }}
          />
        </div>
      )}
      <div className="text-2xl font-bold hidden md:block lg:mb-8">
        <p>Token details</p>
      </div>
      <form
        className="flex flex-col lg:flex-row lg:justify-between gap-3"
        onSubmit={handleCreateToken}
      >
        <div className="lg:w-[47%] flex flex-col gap-y-3">
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
        </div>

        <div className="lg:w-[47%] flex flex-col gap-y-3">
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
              className="py-5 lg:py-10 cursor-pointer rounded-lg flex flex-col items-center justify-center bg-zinc-800 hover:bg-zinc-800/80 transition-all duration-150"
            >
              <div className="flex mb-2">
                {!tokenImageFile && (
                  <span className="mr-3 px-3 py-1 rounded-md bg-zinc-700">
                    Upload image
                  </span>
                )}
                <span className="font-bold">
                  {tokenImageFile?.name ? "Selected image : " : <Upload />}
                </span>
              </div>
              {preview && (
                <div className="flex items-center justify-center h-20 w-20 md:w-28 md:h-28 rounded-[100px] overflow-clip">
                  <img
                    className="w-20 h-20 md:w-28 md:h-28"
                    src={preview}
                    alt="preview"
                  />
                </div>
              )}
            </label>
            <input
              className="absolute inset-1/3 opacity-0"
              type="file"
              id="imageFile"
              accept="image/png, image/jpg, image/jpeg"
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
        </div>
      </form>
    </div>
  );
}

export default TokenLaunchpad;
