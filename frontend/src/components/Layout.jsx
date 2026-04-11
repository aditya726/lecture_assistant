import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { BookOpenText, LayoutDashboard, LogOut, Menu, Moon, ScanLine, Sparkles, StickyNote, Sun } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const navItems = [
  { to: "/workspace", label: "Studio", icon: LayoutDashboard },
  { to: "/notes", label: "Board", icon: StickyNote },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
];

function DesktopNav({ pathname }) {
  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.to);
        return (
          <Button
            key={item.to}
            asChild
            variant={active ? "secondary" : "ghost"}
            className={cn("rounded-full px-4", active && "glow-ring bg-secondary/80")}
          >
            <Link to={item.to}>
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

function MobileNav({ pathname }) {
  return (
    <div className="grid gap-2 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.to);
        return (
          <Button key={item.to} asChild variant={active ? "secondary" : "ghost"} className="justify-start">
            <Link to={item.to}>
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  if (!isAuthenticated || location.pathname === "/") return children;

  const initials = user?.email?.slice(0, 2)?.toUpperCase() || "U";

  return (
    <div className="premium-shell min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="float-up absolute left-[10%] top-24 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="float-down absolute right-[12%] top-20 h-52 w-52 rounded-full bg-violet-400/15 blur-3xl" />
      </div>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 border-b border-white/10 bg-background/40 backdrop-blur-2xl"
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-panel">
              <div className="pb-3">
                <Brand />
              </div>
              <Separator className="mb-3" />
              <MobileNav pathname={location.pathname} />
            </SheetContent>
          </Sheet>

          <Brand />
          <Separator orientation="vertical" className="mx-1 hidden h-6 lg:block" />
          <DesktopNav pathname={location.pathname} />

          <div className="ml-auto flex items-center gap-2">
            <Badge className="hidden rounded-full bg-violet-500/80 text-white sm:inline-flex">Flagship</Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 rounded-full px-2">
                  <Avatar className="ring-1 ring-white/25">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[160px] truncate text-sm sm:inline">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? "Use light appearance" : "Use dark appearance"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="group inline-flex items-center gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-105">
        <BookOpenText className="h-4 w-4" />
      </span>
      <span className="flex items-center gap-1 font-semibold tracking-tight text-foreground">
        Lecture Assistant
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
      </span>
    </Link>
  );
}
