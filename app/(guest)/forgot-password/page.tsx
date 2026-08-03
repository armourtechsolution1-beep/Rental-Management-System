import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/components/guest/ForgotPasswordFlow";

export const metadata: Metadata = {
  title: "Reset your password | RMS",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordFlow />;
}
