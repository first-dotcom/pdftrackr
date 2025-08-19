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

        // Try to access admin stats endpoint to check if user is admin
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        setIsAdmin(response.ok);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isLoaded, getToken]);

  return { isAdmin, loading };
}
