import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Kaushan_Script,
  Space_Mono,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import PennyLoader from "@/components/PennyLoader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Landing-page type system ("Money speaks" theme)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const kaushan = Kaushan_Script({
  variable: "--font-kaushan",
  subsets: ["latin"],
  weight: ["400"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Penny — AI wealth management",
  description:
    "Penny is an AI financial assistant that tracks your assets, analyzes your finances, and helps you grow your net worth.",
  icons: {
    icon: "/Penny.webp",
  },
};

// Runs before first paint to apply the saved theme and avoid a flash.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('penny-theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${jakarta.variable} ${kaushan.variable} ${spaceMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <PennyLoader />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
