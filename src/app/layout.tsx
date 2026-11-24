import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

// One typeface for everything. It was designed for legibility, which
// suits a page you skim half-awake at 9am. next/font downloads it at
// build time, so visitors don't fetch it from Google.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shift Start",
  description: "A morning checklist and quick links for SRE on-call shifts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${atkinson.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
