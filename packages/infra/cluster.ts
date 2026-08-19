import { vpc } from "@repo/infra/vpc"

export const cluster = new sst.aws.Cluster("Cluster", { vpc })
