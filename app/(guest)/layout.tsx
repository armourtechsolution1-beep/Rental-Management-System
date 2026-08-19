import type { ReactNode } from "react";
import { GuestLayout } from "@/components/guest/GuestLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <GuestLayout>{children}</GuestLayout>;
}
