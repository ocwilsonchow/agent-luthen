import { describe, expect, test } from "bun:test"
import {
  isSupportedDrugProfileRegion,
  looksLikeDrugClass,
  normalizeDrugProfileRegion,
} from "./identity"

describe("looksLikeDrugClass", () => {
  test("rejects named classes", () => {
    expect(looksLikeDrugClass("ACE inhibitors")).toBe(true)
    expect(looksLikeDrugClass("SGLT2 inhibitors")).toBe(true)
    expect(looksLikeDrugClass("beta blockers")).toBe(true)
    expect(looksLikeDrugClass("NSAIDs")).toBe(true)
    expect(looksLikeDrugClass("statins")).toBe(true)
  })

  test("accepts specifics, brands, and combos", () => {
    expect(looksLikeDrugClass("metformin")).toBe(false)
    expect(looksLikeDrugClass("Glucophage")).toBe(false)
    expect(looksLikeDrugClass("co-amoxiclav")).toBe(false)
    expect(looksLikeDrugClass("metformin MR")).toBe(false)
  })
})

describe("drug profile region", () => {
  test("accepts UK only", () => {
    expect(isSupportedDrugProfileRegion("UK")).toBe(true)
    expect(isSupportedDrugProfileRegion("uk")).toBe(true)
    expect(isSupportedDrugProfileRegion("US")).toBe(false)
    expect(isSupportedDrugProfileRegion("HK")).toBe(false)
    expect(normalizeDrugProfileRegion(" uk ")).toBe("UK")
  })
})
