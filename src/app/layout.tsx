import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { SidebarProvider } from "@/components/shell/sidebar-provider";
import { GROUPS_COOKIE, SIDEBAR_COOKIE, parseGroups } from "@/lib/sidebar-cookies";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { template: "%s · Oto", default: "Oto" },
  description: "Oto — the company brain.",
};

// Reading cookies here makes every route dynamically rendered. That is the
// point: the sidebar's open/expanded state is server-rendered, so there is no
// hydration flash. Do not move this read client-side.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await cookies();
  const defaultOpen = store.get(SIDEBAR_COOKIE)?.value !== "closed";
  const defaultExpanded = parseGroups(store.get(GROUPS_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SidebarProvider defaultOpen={defaultOpen} defaultExpanded={defaultExpanded}>
          <AppShell>{children}</AppShell>
        </SidebarProvider>
      </body>
    </html>
  );
}
