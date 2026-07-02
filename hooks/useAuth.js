"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth(redirectTo = null) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (redirectTo) {
      router.push(redirectTo);
    }
    setLoading(false);
  }, [redirectTo, router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin/login");
  };

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  return { user, token, loading, logout, getAuthHeaders };
}
