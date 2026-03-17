import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import {
  dmSans,
  inter,
  syne,
  barlow,
  oswald,
  bebasNeue,
  montserrat,
} from "@/lib/fonts";
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
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body
        className={[
          "antialiased",
          inter.variable,
          syne.variable,
          barlow.variable,
          oswald.variable,
          bebasNeue.variable,
          montserrat.variable,
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
