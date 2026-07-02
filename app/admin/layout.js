"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";

const publicRoutes = ["/admin", "/admin/login"];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (publicRoutes.includes(pathname)) {
      setChecking(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role !== "admin") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/admin/login");
          return;
        }
      } catch {}
    }

    setChecking(false);
  }, [pathname, router]);

  const isPublic = publicRoutes.includes(pathname);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (isPublic) {
    return <>{children}</>;
  }

  const handleToggle = () => {
    if (window.innerWidth >= 768) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen bg-bg-main">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={handleToggle} sidebarCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
