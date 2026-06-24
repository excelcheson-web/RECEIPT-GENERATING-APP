import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.skyshiplogistics.com'),
  title: "Skyship Logistics - Global Logistics Made Simple",
  description: "Your trusted partner for global logistics and supply chain solutions. Real-time tracking, reliable delivery worldwide.",
  openGraph: {
    siteName: 'Skyship Logistics',
    title: 'Skyship Logistics - Global Logistics Made Simple',
    description: 'Real-time tracking, air, ocean & road freight to 200+ countries.',
    url: 'https://www.skyshiplogistics.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skyship Logistics',
    description: 'Real-time tracking, air, ocean & road freight to 200+ countries.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
