"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import {
  LayoutDashboard, Ticket, Package,
  BarChart3, Settings, LogOut, Zap, Sun, Moon,
  Users, Clock, Mail, ChevronDown, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: string;
  userName: string;
  permissions: string[];
}

const mainNav = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard, roles: ["ADMIN", "IT_STAFF", "REQUESTER"] },
  { href: "/tickets",    label: "Talepler",     icon: Ticket,          roles: ["ADMIN", "IT_STAFF"] },
  { href: "/my-tickets", label: "Taleplerim",   icon: Ticket,          roles: ["REQUESTER"] },
  { href: "/assets",     label: "Demirbaşlar",  icon: Package,         roles: ["ADMIN", "IT_STAFF"] },
];

const otherNav = [
  { href: "/performance", label: "Performans", icon: BarChart3, roles: ["ADMIN", "IT_STAFF"] },
];

const settingsNav = [
  { href: "/settings/companies", label: "Firmalar",     icon: Building2, permission: "MANAGE_COMPANIES" },
  { href: "/settings/users",     label: "Kullanıcılar", icon: Users,     permission: "MANAGE_USERS"     },
  { href: "/settings/sla",       label: "SLA",          icon: Clock,     permission: "MANAGE_SLA"       },
  { href: "/settings/email",     label: "E-posta",      icon: Mail,      permission: "MANAGE_EMAIL"     },
];

function useDockScale(mouseY: MotionValue<number>, ref: React.RefObject<HTMLDivElement | null>) {
  const scale = useTransform(mouseY, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || val === Infinity) return 1;
    const center = bounds.top + bounds.height / 2;
    const distance = Math.abs(val - center);
    if (distance >= 90) return 1;
    return 1 + (1 - distance / 90) * 0.18;
  });
  return useSpring(scale, { mass: 0.1, stiffness: 220, damping: 16 });
}

function NavItem({
  href, label, icon: Icon, isActive, mouseY,
}: {
  href: string; label: string; icon: typeof Zap; isActive: boolean; mouseY: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useDockScale(mouseY, ref);

  return (
    <motion.div ref={ref} style={{ scale, transformOrigin: "left center" }}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
          isActive
            ? "bg-[#b6ff5a]/15 text-[#3d6b10] dark:bg-[rgba(182,255,90,0.12)] dark:text-[#b6ff5a] shadow-neu-inset dark:shadow-neu-dark-inset"
            : "text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:shadow-neu-sm dark:hover:shadow-neu-dark-sm"
        )}
      >
        <Icon size={15} className={isActive ? "text-[#4a820c] dark:text-[#b6ff5a]" : "text-gray-400 dark:text-[#555]"} />
        <span>{label}</span>
        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#b6ff5a] dark:shadow-[0_0_6px_#b6ff5a]" />}
      </Link>
    </motion.div>
  );
}

function SubNavItem({
  href, label, icon: Icon, isActive, mouseY,
}: {
  href: string; label: string; icon: typeof Zap; isActive: boolean; mouseY: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useDockScale(mouseY, ref);

  return (
    <motion.div ref={ref} style={{ scale, transformOrigin: "left center" }}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150",
          isActive
            ? "bg-[#b6ff5a]/10 text-[#3d6b10] dark:bg-[rgba(182,255,90,0.08)] dark:text-[#b6ff5a]"
            : "text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-[#ccc] hover:bg-gray-50 dark:hover:bg-white/[0.04]"
        )}
      >
        <Icon size={13} className={isActive ? "text-[#4a820c] dark:text-[#b6ff5a]" : "text-gray-300 dark:text-[#444]"} />
        {label}
      </Link>
    </motion.div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-400 dark:text-[#444] hover:text-gray-700 dark:hover:text-[#888] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
    >
      {isDark
        ? <Sun size={13} className="text-gray-400 dark:text-[#555]" />
        : <Moon size={13} className="text-gray-400" />
      }
      <span>{isDark ? "Açık Tema" : "Koyu Tema"}</span>
    </button>
  );
}

export function Sidebar({ userRole, userName, permissions }: SidebarProps) {
  const pathname = usePathname();
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const mouseY = useMotionValue(Infinity);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const visibleMain     = mainNav.filter(i => i.roles.includes(userRole));
  const visibleOther    = otherNav.filter(i => i.roles.includes(userRole));
  const visibleSettings = settingsNav.filter(s => isAdmin || permissions.includes(s.permission));
  const showSettings    = visibleSettings.length > 0;

  const settingsActive = pathname.startsWith("/settings");
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  return (
    <aside
      className="w-56 bg-white dark:bg-[#0d120f] flex flex-col min-h-screen border-r border-gray-100 dark:border-white/[0.05]"
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#b6ff5a] flex items-center justify-center shadow-neu dark:shadow-neu-dark">
            <Zap size={15} className="text-black" />
          </div>
          <span className="font-bold text-gray-900 dark:text-[#e5e5e5] text-sm tracking-wide">ResolveIT</span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="px-3 mt-2">
        <p className="text-[10px] font-semibold text-gray-300 dark:text-[#333] uppercase tracking-[0.12em] px-3 mb-2">Ana Menü</p>
        <div className="space-y-0.5">
          {visibleMain.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} mouseY={mouseY} />
          ))}
        </div>
      </div>

      {/* Other Nav */}
      {visibleOther.length > 0 && (
        <div className="px-3 mt-6">
          <p className="text-[10px] font-semibold text-gray-300 dark:text-[#333] uppercase tracking-[0.12em] px-3 mb-2">Diğer</p>
          <div className="space-y-0.5">
            {visibleOther.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} mouseY={mouseY} />
            ))}
          </div>
        </div>
      )}

      {/* Settings Nav */}
      {showSettings && (
        <div className="px-3 mt-6">
          <p className="text-[10px] font-semibold text-gray-300 dark:text-[#333] uppercase tracking-[0.12em] px-3 mb-2">Yönetim</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setSettingsOpen(o => !o)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
                settingsActive
                  ? "bg-[#b6ff5a]/15 text-[#3d6b10] dark:bg-[rgba(182,255,90,0.12)] dark:text-[#b6ff5a] shadow-neu-inset dark:shadow-neu-dark-inset"
                  : "text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              )}
            >
              <Settings size={15} className={settingsActive ? "text-[#4a820c] dark:text-[#b6ff5a]" : "text-gray-400 dark:text-[#555]"} />
              <span className="flex-1 text-left">Ayarlar</span>
              <ChevronDown
                size={13}
                className={cn(
                  "transition-transform duration-200",
                  settingsOpen ? "rotate-180" : "",
                  settingsActive ? "text-[#4a820c] dark:text-[#b6ff5a]" : "text-gray-300 dark:text-[#444]"
                )}
              />
            </button>
            <motion.div
              initial={false}
              animate={settingsOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pt-0.5">
                {visibleSettings.map(item => (
                  <SubNavItem key={item.href} {...item} isActive={isActive(item.href)} mouseY={mouseY} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section: user + actions */}
      <div className="px-3 pb-5 pt-3 border-t border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors cursor-default">
          <div className="w-7 h-7 rounded-full bg-[#b6ff5a] flex items-center justify-center text-[11px] font-bold text-black shrink-0 shadow-neu-sm dark:shadow-neu-dark-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-[#e5e5e5] truncate">{userName}</p>
            <p className="text-[10px] text-gray-400 dark:text-[#444]">Online</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-xs text-gray-400 dark:text-[#444] hover:text-gray-700 dark:hover:text-[#888] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
        >
          <LogOut size={13} />
          Çıkış Yap
        </button>
        <div className="mt-1">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
