import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const barlowCondensed = localFont({
  src: "./fonts/barlow-condensed-900.woff2",
  variable: "--font-barlow-condensed",
  weight: "900",
  display: "swap",
});

const dmSans = localFont({
  src: "./fonts/dm-sans.woff2",
  variable: "--font-dm-sans",
  weight: "400 500",
  display: "swap",
});

const geist = localFont({
  src: "./fonts/geist.woff2",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Contnental Fitness Gym - Davao City",
  description:
    "Davao's raw, no-nonsense strength and conditioning gym. Build discipline. Build strength. Contnental Fitness Gym, Davao City, Philippines.",
  keywords: [
    "gym",
    "Davao",
    "fitness",
    "strength training",
    "conditioning",
    "Contnental Fitness",
    "Philippines",
  ],
  openGraph: {
    title: "Contnental Fitness Gym - Davao City",
    description:
      "Davao's raw strength and conditioning gym. No fluff. Just work.",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${barlowCondensed.variable} ${dmSans.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="font-body text-text-primary bg-background min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
