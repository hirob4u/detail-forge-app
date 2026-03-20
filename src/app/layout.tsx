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
  description: "Is your business forged through details?",
  metadataBase: new URL("https://detailforge.io"),
  openGraph: {
    title: "DetailForge",
    description: "Is your business forged through details?",
    url: "https://detailforge.io",
    siteName: "DetailForge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DetailForge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DetailForge",
    description: "Is your business forged through details?",
    images: ["/og-image.png"],
  },
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
