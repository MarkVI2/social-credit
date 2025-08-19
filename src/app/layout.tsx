import type { Metadata, Viewport } from "next";
import { Inter, Oswald, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social Credit - Digital Currency System",
  description: "Secure digital wallet and currency exchange platform",
};

// Ensure proper mobile scaling so Tailwind breakpoints and responsive widths behave on real devices
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme from cookies on the server to avoid flicker and apply globally
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";
  return (
    <TRPCReactProvider>
      <SpeedInsights />
      <html
        lang="en"
        className={theme === "dark" ? "dark" : "light"}
        suppressHydrationWarning
      >
        <body
          className={`${inter.variable} ${oswald.variable} ${jbMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </TRPCReactProvider>
  );
}
