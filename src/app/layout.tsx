import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildFlow",
  description: "원하는 결과를 위한 AI 워크플로 설계 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-[#090909] text-zinc-100">{children}</body>
    </html>
  );
}
