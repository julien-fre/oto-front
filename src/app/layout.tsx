import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { AuthProvider } from "@/components/auth-provider";
import { KnowledgeProvider } from "@/components/knowledge/knowledge-provider";
import { OrgProvider } from "@/components/org-provider";
import { ProcessesProvider } from "@/components/processes-provider";
import { SidebarProvider } from "@/components/shell/sidebar-provider";
import { VersionProvider } from "@/components/shell/version-provider";
import {
  GROUPS_COOKIE,
  parseGroups,
  parseWidth,
  SIDEBAR_COOKIE,
  WIDTH_COOKIE,
} from "@/lib/sidebar-cookies";
import { parseVersion, VERSION_COOKIE } from "@/lib/version-cookie";
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
  const defaultWidth = parseWidth(store.get(WIDTH_COOKIE)?.value);
  const defaultVersion = parseVersion(store.get(VERSION_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>
          {/* Knowledge and Processes sit above the shell because the sidebar
              lists both live from here — see the note in
              knowledge-provider.tsx / processes-provider.tsx. OrgProvider
              nests inside both: switching org calls their refresh(), which
              means calling their hooks, which requires being their
              descendant. */}
          <KnowledgeProvider>
            <ProcessesProvider>
              <OrgProvider>
                <SidebarProvider
                  defaultOpen={defaultOpen}
                  defaultExpanded={defaultExpanded}
                  defaultWidth={defaultWidth}
                >
                  <VersionProvider defaultVersion={defaultVersion}>
                    <AppShell>{children}</AppShell>
                  </VersionProvider>
                </SidebarProvider>
              </OrgProvider>
            </ProcessesProvider>
          </KnowledgeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
