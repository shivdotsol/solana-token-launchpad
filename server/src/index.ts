import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { ENV } from "./config/env.js";
import { pinata } from "./config/pinata.js";
import { computeFileName, verifySignature } from "./utils/helpers.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/signedUrl", async (req, res) => {
  const { publicKey, fileType } = req.body;

  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 120,
      name: computeFileName(publicKey, fileType),
      groupId: ENV.PINATA_GROUP_ID,
    });
    res.json({ url });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "Error creating signed URL" });
  }
});

app.post("/uploadJSON", async (req, res) => {
  const { metadata } = req.body;
  try {
    const upload = await pinata.upload.public.json(metadata);
    if (upload.cid) {
      res.json({ message: "upload success", cid: upload.cid });
    } else {
      res.json({ message: "upload failed" });
    }
  } catch (err: any) {
    res.status(500).json({ message: "internal server error", error: err });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "okay",
  });
});

app.listen(ENV.PORT, () => console.log(`Server started on PORT ${ENV.PORT}`));
