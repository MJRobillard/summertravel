import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Summer Travel Itinerary",
  description: "Interactive map of my summer travel itinerary across the United States",
  icons: {
    icon: [
      {
        url: "https://tse4.mm.bing.net/th/id/OIP.0gfdme9v_2s16jdJ_phQgwHaHa?r=0&rs=1&pid=ImgDetMain&cb=idpwebpc1",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "https://tse4.mm.bing.net/th/id/OIP.0gfdme9v_2s16jdJ_phQgwHaHa?r=0&rs=1&pid=ImgDetMain&cb=idpwebpc1",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
