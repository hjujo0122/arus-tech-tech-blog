import type { Metadata } from "next";
import { Geist, Geist_Mono, Klee_One } from "next/font/google";
import Image from "next/image";
import Script from "next/script";
import Header from "@/components/Header";
import "./globals.css";

const GA_ID = "G-XX7BN7BKCJ";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kleeOne = Klee_One({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-klee-one",
});


const SITE_URL = "https://arus-tech-tech.web.app";
const SITE_NAME = "あるすのてくてくブログ";
const SITE_DESCRIPTION = "社内SEあるすの日記がわりブログ。技術・日常・美少女オタク話など。";
const OG_IMAGE = `${SITE_URL}/chika-header.png`;

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: OG_IMAGE }],
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  verification: {
    google: "k23Lpah2hrasVA2xa2kWltMMCc1QNS5E4JySg_LHgvI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${kleeOne.variable} h-full antialiased`}
    >
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
<body className="flex min-h-full flex-col">
<Header />

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-border">
          <div className="relative mx-auto max-w-2xl px-4 py-6 text-sm text-subtext">
            <Image
              src="/chika-header.webp"
              alt="知佳"
              width={50}
              height={65}
              className="object-contain absolute -top-[65px] right-4"
            />
            © 2026 あるす ⚡
          </div>
        </footer>
      </body>
    </html>
  );
}
