"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function useAdmin() {
  const { getToken, isLoaded } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const checkAdminStatus = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Get user profile which includes admin status
        const response = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.data?.user?.isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isLoaded, getToken]);

  return { isAdmin, loading };
}
