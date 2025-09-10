import { PinataSDK } from "pinata";
import { ENV } from "./env.js";

export const pinata = new PinataSDK({
  pinataJwt: ENV.PINATA_JWT,
  pinataGateway: ENV.PINATA_GATEWAY,
});
