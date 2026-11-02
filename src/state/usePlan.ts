import { useEffect, useState } from "react";
import { UserPlan, VendorPlan } from "../domain/entitlements";
import { resolveUserPlan, resolveVendorPlan } from "../services/plans";

export function useUserPlan(eventId?: string) {
  const [plan, setPlan] = useState<UserPlan>("basic");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void resolveUserPlan(eventId)
      .then((value) => {
        if (active) setPlan(value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);
  return { plan, loading };
}

export function useVendorPlan() {
  const [plan, setPlan] = useState<VendorPlan>("basic");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void resolveVendorPlan()
      .then((value) => {
        if (active) setPlan(value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return { plan, loading };
}
