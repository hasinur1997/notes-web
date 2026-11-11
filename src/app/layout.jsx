import { Suspense } from "react";
import { Nunito } from "next/font/google";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: { default: "Notes", template: "%s · Notes" },
  description: "Private notes, public posts and simple sharing.",
};

/**
 * Root layout: font, auth state, the page-loading bar and the toast container for every page.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export default function RootLayout({ children }) {
  return (
    // data-scroll-behavior lets Next.js turn smooth scrolling off while it changes routes, so a new page
    // starts at the top at once instead of gliding there.
    <html lang="en" className={`${nunito.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-full">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AuthProvider>{children}</AuthProvider>
        <Toaster theme="light" position="bottom-center" richColors />
      </body>
    </html>
  );
}
