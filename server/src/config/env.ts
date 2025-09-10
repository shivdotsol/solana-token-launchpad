import dotenv from "dotenv";
dotenv.config();

function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} env variable not defined.`);
  return value;
}

export const ENV = {
  PORT: getEnvVariable("PORT"),
  PINATA_JWT: getEnvVariable("PINATA_JWT"),
  PINATA_GATEWAY: getEnvVariable("PINATA_GATEWAY"),
  PINATA_GROUP_ID: getEnvVariable("PINATA_GROUP_ID"),
};
