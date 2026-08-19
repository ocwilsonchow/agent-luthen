/* Copied from SST-generated sst-env.d.ts so `tsc` in Docker sees Resource types. */
/* tslint:disable */
/* eslint-disable */

declare module "sst" {
  export interface Resource {
    API: {
      service: string
      type: "sst.aws.Service"
      url: string
    }
    BETTER_AUTH_SECRET: {
      type: "sst.sst.Secret"
      value: string
    }
    DATABASE_URL: {
      type: "sst.sst.Secret"
      value: string
    }
    Vpc: {
      type: "sst.aws.Vpc"
    }
  }
}

import "sst"
export {}
