import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import  ReduxProvider  from "@/redux/ReduxProvider";
import Background from "../components/Background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RPSense",
  description: "Play Rock Paper Scissors with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <div className="min-h-screen relative">
            <Background />
            <main className="relative">{children}</main>
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
