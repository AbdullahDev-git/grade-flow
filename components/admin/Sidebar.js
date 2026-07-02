"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ClipboardList, TrendingUp, UserPlus, X } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/grades", label: "Grades", icon: TrendingUp },
  { href: "/admin/invite", label: "Invite Students", icon: UserPlus },
];

export default function Sidebar({ mobileOpen, onClose, collapsed }) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
              G
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                G
              </div>
              <span className="text-white font-bold text-lg">GradeFlow</span>
            </div>
            <p className="text-sidebar-text text-xs mt-1">Admin Panel</p>
          </>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (mobileOpen) onClose?.(); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/20 text-primary border-r-4 border-primary rounded-r-none"
                  : "text-sidebar-text hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center border-r-0 rounded-r-lg" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <p className="text-sidebar-text text-xs">© {new Date().getFullYear()} GradeFlow</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:flex flex-shrink-0 h-screen bg-sidebar-bg flex-col overflow-y-auto scrollbar-thin transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-60 h-full bg-sidebar-bg flex flex-col overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end p-3">
                <button onClick={onClose} className="p-2 rounded-lg text-sidebar-text hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
