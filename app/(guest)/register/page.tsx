import type { Metadata } from "next";
import { RegisterForm } from "@/components/guest/RegisterForm";

export const metadata: Metadata = {
  title: "Create a landlord account | RMS",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
