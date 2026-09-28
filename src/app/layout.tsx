import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fleet Management System (FMS)",
  description:
    "Automated monitoring, dispatch, and maintenance coordination for public transport fleets -- EDRMC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="antialiased text-white bg-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
