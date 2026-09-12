import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
