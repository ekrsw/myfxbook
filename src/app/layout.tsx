import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Myfxbook Balance Dashboard",
  description: "Real-time Myfxbook account balance monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
