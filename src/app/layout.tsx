import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lydian Gravity",
  description:
    "A modal songwriting workspace for sketching sections, chord motion, melodic ideas, and theory cues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
