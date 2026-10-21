import type { Metadata } from "next";
import { Fredoka, Lato, Nunito_Sans } from "next/font/google";
import { trainer } from "@/content";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

/** Pokémon GO's UI typeface, for every menu screen. */
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://developer-go.vercel.app"),
  title: "Tyler Dong",
  openGraph: { title: "Tyler Dong", siteName: "Tyler Dong", type: "website" },
  twitter: { card: "summary_large_image", title: "Tyler Dong" },
  description:
    "Tyler Dong: SDE intern at AWS, CS + Computer Engineering at Northeastern. Explore my work Pokémon GO style: gyms are jobs, PokéStops are projects, raids are hackathons.",
  alternates: { canonical: "/" },
};

/** Who this site is about, for search engines (schema.org Person), from the same content as everything else. */
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: trainer.name,
  url: "https://developer-go.vercel.app",
  email: `mailto:${trainer.email}`,
  jobTitle: "Software engineering student",
  alumniOf: { "@type": "CollegeOrUniversity", name: trainer.school.name },
  sameAs: trainer.links.map((l) => l.href),
};

// Like the game, the map turns to night after dark, unless the visitor picked
// day or night themselves. Runs before first paint, so there's no flash.
const timeOfDay = `(function(){try{var t=localStorage.getItem("time");if(t!=="day"&&t!=="night"){var h=new Date().getHours();t=h>=19||h<6?"night":"day"}document.documentElement.setAttribute("data-time",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-time="day"
      suppressHydrationWarning
      className={`${fredoka.variable} ${lato.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: timeOfDay }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
        {children}
      </body>
    </html>
  );
}
