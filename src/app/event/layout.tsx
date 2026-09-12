import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";

export default function EventLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
