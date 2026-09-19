"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// short: alt menüde 8 sekme telefon genişliğine sığmadığı için kısa ad kullanılır.
const LINKS = [
  { href: "/", label: "Panel", short: "Panel" },
  { href: "/odevler", label: "Ödevler", short: "Ödev" },
  { href: "/sorular", label: "Sorular", short: "Soru" },
  { href: "/hatalar", label: "Hatalar", short: "Hata" },
  { href: "/konular", label: "Konular", short: "Konu" },
  { href: "/denemeler", label: "Denemeler", short: "Deneme" },
  { href: "/hedefler", label: "Hedefler", short: "Hedef" },
  { href: "/analiz", label: "Analiz", short: "Analiz" },
];

export default function NavBar({
  userName,
  buildSha,
}: {
  userName: string;
  buildSha?: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            aria-label="Panel'e dön"
            className="flex items-center gap-2 rounded-lg text-lg font-bold text-brand-700 transition hover:text-brand-800"
          >
            LGS Takip
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand-100 text-brand-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            {buildSha && (
              <span className="text-[10px] text-gray-300" title="Yayındaki sürüm">
                #{buildSha}
              </span>
            )}
            <span className="hidden text-sm text-gray-500 sm:inline">{userName}</span>
            <Link
              href="/ayarlar"
              className={`text-xs font-medium ${
                pathname === "/ayarlar" ? "text-brand-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Ayarlar
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-secondary !px-3 !py-1.5 text-xs"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white md:hidden">
        <div className="flex justify-around">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 px-0.5 py-2.5 text-center text-[11px] font-medium ${
                  active ? "text-brand-700" : "text-gray-500"
                }`}
              >
                {link.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
