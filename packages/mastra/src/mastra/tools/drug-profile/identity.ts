export const SUPPORTED_DRUG_PROFILE_REGIONS = ["UK"] as const
export type DrugProfileRegion = (typeof SUPPORTED_DRUG_PROFILE_REGIONS)[number]

const CLASS_NAME =
  /^(ace inhibitors?|arbs?|beta[- ]blockers?|calcium channel blockers?|sglt-?2 inhibitors?|glp-?1(?: receptor)? agonists?|dpp-?4 inhibitors?|ppis?|nsaids?|ssris?|snris?|antibiotics|antivirals|antifungals|statins|corticosteroids|benzodiazepines|opioids|anticoagulants|antipsychotics|antidepressants|diuretics)$/i

const CLASS_SUFFIX =
  /\b(inhibitors?|blockers?|agonists?|antagonists|antibiotics|antivirals)\s*$/i

export function looksLikeDrugClass(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return false
  return CLASS_NAME.test(trimmed) || CLASS_SUFFIX.test(trimmed)
}

export function normalizeDrugProfileRegion(region: string): string {
  return region.trim().toUpperCase()
}

export function isSupportedDrugProfileRegion(
  region: string
): region is DrugProfileRegion {
  return normalizeDrugProfileRegion(region) === "UK"
}
