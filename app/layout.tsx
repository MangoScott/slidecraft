import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlideCraft - Automated Presentation Maker",
  description: "Transform any URL into a beautiful presentation with AI-powered slide generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
