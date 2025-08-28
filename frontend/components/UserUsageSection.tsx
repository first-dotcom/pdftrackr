"use client";

import UsageCard, { type UsageCardProps } from "@/components/UsageCard";
import { useApi } from "@/hooks/useApi";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function UserUsageSection() {
  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();

  const isReady = authLoaded && userLoaded;

  const [data, setData] = useState<UsageCardProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (isReady && user) {
      const run = async () => {
        try {
          setLoading(true);
          const response = await api.users.profile();
          if (!cancelled && response.success && response.data) {
            const userData = (response.data as any).user;
            const quotas = (response.data as any).quotas;
            setData({
              storageUsed: userData.storageUsed,
              storageQuota: quotas.storage,
              filesCount: userData.filesCount,
              filesQuota: quotas.fileCount,
              plan: userData.plan,
              isLoading: false,
            });
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      run();
    }
    return () => {
      cancelled = true;
    };
  }, [isReady, user, api]);

  if (!isReady) {
    return <UsageCard storageUsed={0} storageQuota={0} filesCount={0} filesQuota={0} isLoading />;
  }

  if (!user) {
    return <UsageCard storageUsed={0} storageQuota={0} filesCount={0} filesQuota={0} isLoading />;
  }

  if (loading || !data) {
    return <UsageCard storageUsed={0} storageQuota={0} filesCount={0} filesQuota={0} isLoading />;
  }

  return <UsageCard {...data} />;
}
