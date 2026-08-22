import { z } from "zod"

export const drugProfileLengthSchema = z.enum(["concise", "detailed"])
export const drugProfileRegionSchema = z.enum(["UK"])

export const drugProfileGenerateInputSchema = z.object({
  name: z.string().min(1),
  indication: z.string().nullable(),
  length: drugProfileLengthSchema,
  region: z.string(),
  audience: z.enum(["professional", "public"]),
  locale: z.enum(["en", "zh-hk", "zh-cn"]),
})

export const drugProfileInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe("Generic name, brand, combo, or salt. Not a drug class."),
  indication: z
    .string()
    .optional()
    .describe(
      "Optional licensed adult indication to focus dose and monitoring."
    ),
  length: drugProfileLengthSchema
    .optional()
    .describe("concise = scan bullets. detailed = fuller monograph."),
  region: drugProfileRegionSchema
    .optional()
    .describe("Source pack. Only UK is supported."),
})

export const drugProfileSourceSchema = z.object({
  url: z.string(),
  title: z.string(),
})

export const drugProfileSectionSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  body: z.string().nullable(),
  sources: z.array(drugProfileSourceSchema),
})

export const drugProfileSectionsSchema = z.object({
  indications: drugProfileSectionSchema,
  mechanism: drugProfileSectionSchema,
  adverseEffects: drugProfileSectionSchema,
  warnings: drugProfileSectionSchema,
  interactions: drugProfileSectionSchema,
  prescription: drugProfileSectionSchema,
  administration: drugProfileSectionSchema,
  communication: drugProfileSectionSchema,
  monitoring: drugProfileSectionSchema,
})

export const drugProfileIdentitySchema = z.object({
  status: z.enum(["ok", "ambiguous", "class_not_supported", "not_found"]),
  resolvedName: z.string().nullable(),
  resolvedFromBrand: z.string().nullable(),
  candidates: z.array(z.string()),
})

export const drugProfileStructuredSchema = z.object({
  identity: drugProfileIdentitySchema,
  sections: drugProfileSectionsSchema,
})

export const drugProfileOutputSchema = z.object({
  status: z.enum([
    "ok",
    "not_found",
    "ambiguous",
    "class_not_supported",
    "unsupported_region",
  ]),
  message: z.string(),
  resolvedName: z.string().nullable(),
  resolvedFromBrand: z.string().nullable(),
  candidates: z.array(z.string()),
  indication: z.string().nullable(),
  region: z.string(),
  length: drugProfileLengthSchema,
  sections: drugProfileSectionsSchema.nullable(),
})

export type DrugProfileOutput = z.infer<typeof drugProfileOutputSchema>
export type DrugProfileSections = z.infer<typeof drugProfileSectionsSchema>

export function emptyDrugProfileSections(): DrugProfileSections {
  const empty = {
    status: "unavailable" as const,
    body: null,
    sources: [],
  }
  return {
    indications: empty,
    mechanism: empty,
    adverseEffects: empty,
    warnings: empty,
    interactions: empty,
    prescription: empty,
    administration: empty,
    communication: empty,
    monitoring: empty,
  }
}
