"use client";

import * as React from "react";
import { redirect } from "next/navigation";
import { SignIn, SignUp, useUser } from "@clerk/nextjs";

import { cn } from "@saasfly/ui";

type Dictionary = Record<string, string>;

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  lang: string;
  dict?: Dictionary;
  disabled?: boolean;
  isSignUp?: boolean;
}

export function UserClerkAuthForm({
  className,
  lang,
  isSignUp = false,
  ...props
}: UserAuthFormProps) {
  const { user } = useUser()
  if (user) {
    redirect(`/${lang}/dashboard`)
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {isSignUp ? (
        <SignUp fallbackRedirectUrl={`/${lang}/dashboard`} />
      ) : (
        <SignIn fallbackRedirectUrl={`/${lang}/dashboard`} />
      )}
    </div>
  );
}
