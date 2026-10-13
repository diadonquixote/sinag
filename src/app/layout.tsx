import type { Metadata } from "next";
import { ORG_NAME } from "@/lib/org";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StageBanner from "@/components/StageBanner";
import { getLang, getT } from "@/lib/i18n";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: { default: `Sinag — ${ORG_NAME}`, template: `%s · Sinag` },
    description: lang === "fil"
      ? `Ang mga proyekto, iskedyul, katitikan at gastos ng ${ORG_NAME}, bukas para makita ng bawat kabataan.`
      : `The projects, schedule, minutes and spending of the ${ORG_NAME}, open for every kabataan to see.`,
  };
}

// Pages read the session and the database on every request.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = await getT();
  return (
    <html lang={lang === "fil" ? "fil" : "en"} className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">{t("skip")}</a>
        <StageBanner />
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
