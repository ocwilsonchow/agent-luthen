/// <reference path="../../.sst/platform/config.d.ts" />

export const databaseUrl = new sst.Secret("DATABASE_URL")
export const betterAuthSecret = new sst.Secret("BETTER_AUTH_SECRET")
export const pineconeApiKey = new sst.Secret("PINECONE_API_KEY")
export const tavilyApiKey = new sst.Secret("TAVILY_API_KEY")
export const langfuseSecretKey = new sst.Secret("LANGFUSE_SECRET_KEY")
export const langfusePublicKey = new sst.Secret("LANGFUSE_PUBLIC_KEY")
export const langfuseBaseUrl = new sst.Secret("LANGFUSE_BASE_URL")
