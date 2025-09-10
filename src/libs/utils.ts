import axios from "axios";
import { pinata } from "./pinata";

export const uploadMetadataToIPFS = async (
  publicKey: string,
  fileType: string,
  jsonMetadata: Object,
  imageFile: File
) => {
  // get signedUrl for image
  const res = await getSignedUrlForImage(publicKey, fileType);
  if (!res?.data.url)
    return { message: "failed to get presigned url for image", url: null };

  // upload image to pinata
  let imageCid = "";
  try {
    const upload = await pinata.upload.public.file(imageFile).url(res.data.url);
    if (upload.cid) {
      imageCid = upload.cid;
    } else {
      return { message: "failed to upload image file", url: null };
    }
  } catch (err: any) {
    return { message: err, url: null };
  }

  // send json object to server to get back an IPFS uri

  // upload json object
  // return onject uri
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

const getSignedUrlForMetadata = async () => {};
