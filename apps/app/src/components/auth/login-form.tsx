"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import { sessionQueryKey, signInMutationOptions } from "@/lib/queries/session"

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export function LoginForm() {
  const t = useTranslations("auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const signIn = useMutation(signInMutationOptions)

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      await signIn.mutateAsync(value)
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
      const next = searchParams.get("next")
      router.replace(next && next.startsWith("/") ? next : "/")
    },
  })

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("email")}</Label>
            <Input
              id={field.name}
              name={field.name}
              type="email"
              autoComplete="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-destructive text-sm">{t("emailInvalid")}</p>
            ) : null}
          </div>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("password")}</Label>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-destructive text-sm">
                {t("passwordRequired")}
              </p>
            ) : null}
          </div>
        )}
      </form.Field>
      {signIn.isError ? (
        <p className="text-destructive text-sm">{t("error")}</p>
      ) : null}
      <Button disabled={signIn.isPending} type="submit">
        {signIn.isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
