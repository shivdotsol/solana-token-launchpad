import dotenv from "dotenv";
dotenv.config();

function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} env variable not defined.`);
  return value;
}

export const ENV = {
  RPC_URL: getEnvVariable("RPC_URL"),
  BACKEND_URL: getEnvVariable("BACKEND_URL"),
};
