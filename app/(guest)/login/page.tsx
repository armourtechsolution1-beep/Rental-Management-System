import type { Metadata } from "next";
import { LoginForm } from "@/components/guest/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | RMS",
};

interface LoginPageProps {
  searchParams: { callbackUrl?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginForm callbackUrl={searchParams.callbackUrl} />;
}
