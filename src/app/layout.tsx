import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connections Helper",
  description: "A tool to help solve NYT Connections puzzles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
