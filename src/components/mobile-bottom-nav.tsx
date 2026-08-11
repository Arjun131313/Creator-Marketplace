"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/creators", label: "Browse", icon: "explore" },
  { href: "/messages", label: "Messages", icon: "mail" },
  { href: "/creator/dashboard", label: "Profile", icon: "person" },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-t border-[#10141b]/10 flex justify-around items-center px-4 pt-2 pb-4">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-all p-2 ${
              isActive
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="font-label-sm text-label-sm mt-0.5">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
