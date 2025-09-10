export function computeFileName(publicKey: string, fileType: string) {
  const fileName = `${publicKey.slice(0, 4)}..${publicKey.slice(
    -4
  )}-${Math.floor(Math.random() * 10000)}.${fileType}`;
  return fileName;
}

export async function verifySignature(signature: string, publicKey: string) {
  // sign verification logic
  return true;
}
