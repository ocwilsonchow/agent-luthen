import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { authClient } from "@/lib/auth"

export const sessionQueryKey = ["session"] as const

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: async () => {
    const { data, error } = await authClient.getSession()
    if (error) throw error
    return data
  },
})

export const signInMutationOptions = mutationOptions({
  mutationFn: async (input: { email: string; password: string }) => {
    const { data, error } = await authClient.signIn.email(input)
    if (error) throw error
    return data
  },
})

export const signOutMutationOptions = mutationOptions({
  mutationFn: async () => {
    const { error } = await authClient.signOut()
    if (error) throw error
  },
})
