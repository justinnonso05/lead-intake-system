import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lead Intake System",
  description: "Advanced lead qualification and enrichment system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <main className="container mx-auto py-10 px-4">
          {children}
        </main>
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
