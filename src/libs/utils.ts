import axios from "axios";
import { pinata } from "./pinata";

export interface MetadataObject {
  name: string;
  symbol: string;
  image: string;
  description: string;
}

export interface MetadataUploadResponse {
  message: string;
  cid: string | null;
}

export interface MetadataUploadParams {
  publicKey: string;
  metadata: MetadataObject;
  imageFile: File;
}

export const uploadMetadataToIPFS = async ({
  publicKey,
  metadata,
  imageFile,
}: MetadataUploadParams): Promise<MetadataUploadResponse> => {
  // get signedUrl for image

  const fileType = imageFile.name.split(".").pop()?.toLocaleLowerCase() || "";
  if (!fileType) {
    return { message: "invalid/missing file type", cid: null };
  }
  const res = await getSignedUrlForImage(publicKey, fileType);
  if (!res?.data.url)
    return { message: "failed to get presigned url for image", cid: null };

  // upload image to pinata

  try {
    const upload = await pinata.upload.public.file(imageFile).url(res.data.url);
    if (upload.cid) {
      metadata.image = `https://ipfs.io/ipfs/${upload.cid}`;
      // console.log(metadata.image);
    } else {
      return { message: "failed to upload image file", cid: null };
    }
  } catch (err: any) {
    return { message: `error: ${err}`, cid: null };
  }

  // upload metadata object to IPFS

  try {
    const upload = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/uploadJSON`,
      { metadata }
    );
    if (upload.data.cid) {
      return {
        message: "metadata successfully uploaded",
        cid: upload.data.cid,
      };
    } else {
      return { message: "failed to upload metadata json", cid: null };
    }
  } catch (err: any) {
    return { message: `error: ${err}`, cid: null };
  }
};

const getSignedUrlForImage = async (publicKey: string, fileType: string) => {
  try {
    const url = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/signedUrl`,
      { publicKey, fileType }
    );
    return url;
  } catch (error: any) {
    return null;
  }
};
