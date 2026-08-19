/// <reference path="../../.sst/platform/config.d.ts" />

export const databaseUrl = new sst.Secret("DATABASE_URL")
export const betterAuthSecret = new sst.Secret("BETTER_AUTH_SECRET")
export const pineconeApiKey = new sst.Secret("PINECONE_API_KEY")
export const tavilyApiKey = new sst.Secret("TAVILY_API_KEY")
