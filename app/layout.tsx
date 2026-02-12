import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 你画我猜",
  description: "在画布上作画，让 AI 猜你的内容。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
