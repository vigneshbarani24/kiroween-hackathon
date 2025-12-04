import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resurrection Platform - SAP Legacy AI Alternative",
  description: "Transform haunted legacy ABAP into modern SAP CAP applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        > */}
          {/* <ErrorBoundary> */}
            {children}
          {/* </ErrorBoundary> */}
          {/* <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a0f2e',
                color: '#F7F7FF',
                border: '1px solid #5b21b6',
              },
            }}
          /> */}
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
