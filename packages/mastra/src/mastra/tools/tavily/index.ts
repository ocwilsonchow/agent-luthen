import { createTavilyExtractTool, createTavilySearchTool } from "@mastra/tavily"
import { Resource } from "sst"

const tavilyOptions = { apiKey: Resource.TAVILY_API_KEY.value }

export const tavilySearchTool = createTavilySearchTool(tavilyOptions)
export const tavilyExtractTool = createTavilyExtractTool(tavilyOptions)
