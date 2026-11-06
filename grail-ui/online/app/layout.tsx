import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성배전쟁 온라인 알파",
  description: "탐색하고 제작하며 최후의 생존자가 되는 실시간 성배전쟁.",
icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
