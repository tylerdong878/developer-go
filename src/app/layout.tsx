import type { Metadata } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
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
    "CS + Computer Engineering at Northeastern. Explore my work Pokémon GO style: gyms are jobs, PokéStops are projects, raids are hackathons.",
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
      className={`${fredoka.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: timeOfDay }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
