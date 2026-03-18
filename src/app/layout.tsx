import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { allOrgFonts } from "@/lib/fonts";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "DetailForge",
  description:
    "AI-powered estimates and cost intelligence for detailing professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[
        jetbrainsMono.variable,
        ...allOrgFonts.map((f) => f.variable),
      ].join(" ")}
    >
      <body className="antialiased bg-[#0A0A0F] text-[#E8E8EF]">
        {children}
      </body>
    </html>
  );
}
