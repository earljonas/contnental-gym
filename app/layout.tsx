import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Continental Fitness Gym - Davao City",
  description:
    "Davao's raw, no-nonsense strength and conditioning gym. Build discipline. Build strength. Continental Fitness Gym, Davao City, Philippines.",
  keywords: [
    "gym",
    "Davao",
    "fitness",
    "strength training",
    "conditioning",
    "Continental Fitness",
    "Philippines",
  ],
  openGraph: {
    title: "Continental Fitness Gym - Davao City",
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
      className={`${barlowCondensed.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="font-body text-text-primary bg-background min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
