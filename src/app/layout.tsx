import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Automation Platform",
  description: "Self-hosted email automation — events, contacts, and workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
