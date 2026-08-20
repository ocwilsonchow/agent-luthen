import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { Resource } from "sst"
import * as schema from "./schema/index.ts"

const client = postgres(Resource.DATABASE_URL.value, {
  ssl: "require",
})

export const db = drizzle(client, { schema })

export type Database = typeof db

export { and, asc, count, desc, eq } from "drizzle-orm"
