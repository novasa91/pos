"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Receipt,
  Package,
  Users,
  UserCog,
  BarChart3,
  Settings,
  CreditCard,
  Truck,
  FileText,
  LogOut,
  Store,
  Tags,
  ChefHat,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useT } from "@/components/locale-provider";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/app/pos", label: "nav.pos", icon: ShoppingCart },
  { href: "/app/sales", label: "nav.sales", icon: Receipt },
  { href: "/app/products", label: "nav.products", icon: Package },
  { href: "/app/categories", label: "nav.categories", icon: Tags },
  { href: "/app/customers", label: "nav.customers", icon: Users },
  { href: "/app/suppliers", label: "nav.suppliers", icon: Truck },
  { href: "/app/purchases", label: "nav.purchases", icon: FileText },
  { href: "/app/employees", label: "nav.employees", icon: UserCog },
  { href: "/app/reports", label: "nav.reports", icon: BarChart3 },
  { href: "/app/settings", label: "nav.settings", icon: Settings },
  { href: "/app/billing", label: "nav.billing", icon: CreditCard },
];

// External links (not part of main nav)
const TOOLS: NavItem[] = [
  { href: "/kitchen", label: "ครัว KDS", icon: ChefHat },
];

export function DashboardShell({
  children,
  shopName,
  userName,
  userEmail,
  tenants,
  activeTenantId,
}: {
  children: React.ReactNode;
  shopName: string;
  userName: string | null;
  userEmail: string;
  tenants: Array<{ id: string; name: string }>;
  activeTenantId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();

  const initials = (userName || userEmail || "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar — glass + gradient */}
      <aside className="hidden w-64 shrink-0 flex-col md:flex relative overflow-hidden">
        {/* Aurora background */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-[#7c3aed]/15 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-40 w-40 rounded-full bg-[#ec4899]/10 blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
        <div className="pointer-events-none absolute top-1/3 right-0 h-32 w-32 rounded-full bg-[#06b6d4]/8 blur-3xl animate-float" style={{ animationDelay: "-4s" }} />

        {/* Top brand */}
        <div className="relative z-10 flex h-16 shrink-0 items-center border-b border-[#7c3aed]/15 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] via-[#7c3aed] to-[#5b21b6] shadow-lg shadow-[#7c3aed]/30 animate-pulse-glow">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <div className="font-bold text-base tracking-tight bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] bg-clip-text text-transparent">{t.app.name}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">POS System</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 overflow-y-auto p-3">
          <ul className="space-y-1 stagger-children">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              const label = (t.nav as any)[item.label.split(".")[1]] as string;
              return (
                <li key={item.href} className="animate-slide-in-left">
                  <Link
                    href={item.href}
                    className={`sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active ? "active text-[#a78bfa]" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7c3aed] shadow-[0_0_8px_#7c3aed] pulse-dot" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Tools section */}
          <div className="mt-6">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              เครื่องมือ
            </div>
            <ul className="space-y-1">
              {TOOLS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href} className="animate-slide-in-left">
                    <Link
                      href={item.href}
                      target={item.href.startsWith("/kitchen") ? "_blank" : undefined}
                      className={`sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                        active ? "active text-[#a78bfa]" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Shop badge */}
        <div className="relative z-10 border-t border-[#7c3aed]/15 p-3">
          <div className="rounded-xl border border-[#7c3aed]/20 bg-gradient-to-br from-[#7c3aed]/10 via-[#ec4899]/5 to-transparent px-4 py-3 glow-border">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">ร้านปัจจุบัน</div>
            <div className="truncate text-sm font-semibold bg-gradient-to-r from-[#5b21b6] to-[#ec4899] bg-clip-text text-transparent">{shopName}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top accent bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#06b6d4] animate-shimmer" />

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e9d5ff]/50 bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/app" className="font-bold">{t.app.name}</Link>
          </div>
          <div className="flex-1" />
          {tenants.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm">
                  <Store className="mr-2 h-4 w-4" />
                  {shopName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>เปลี่ยนร้าน</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tenants.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => router.push(`/select-tenant?switch=${t.id}`)}
                  >
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="ml-2 h-9 w-9 rounded-full p-0 relative group overflow-hidden inline-flex items-center justify-center hover:bg-muted"
              aria-label="User menu"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <Avatar className="h-9 w-9 relative">
                <AvatarFallback className="bg-gradient-to-br from-[#7c3aed]/20 to-[#ec4899]/20 text-[#5b21b6] font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{userName || userEmail}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/app/settings")}>
                {t.nav.settings}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/app/billing")}>
                {t.nav.billing}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.nav.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/95 page-enter">{children}</main>
      </div>
    </div>
  );
}
