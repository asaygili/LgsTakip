import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LGS Takip",
  description: "LGS öğrencisi çalışma takip uygulaması",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="tr">
      <body className="min-h-screen pb-16 md:pb-0">
        <SessionProvider session={session}>
          {session?.user && <NavBar userName={session.user.name ?? ""} />}
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
