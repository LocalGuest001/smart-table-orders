import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Membership = {
  restaurant_id: string;
  role: "owner" | "staff" | "chef";
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    subscription_status: string;
  };
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  memberships: Membership[];
  activeRestaurantId: string | null;
  setActiveRestaurantId: (id: string | null) => void;
  refreshMemberships: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeRestaurantId, setActiveId] = useState<string | null>(null);

  const setActiveRestaurantId = (id: string | null) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem("sm_active_restaurant", id);
      else localStorage.removeItem("sm_active_restaurant");
    }
  };

  const fetchMemberships = async (uid: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("restaurant_id, role, restaurant:restaurants!inner(id, name, slug, logo_url, subscription_status)")
      .eq("user_id", uid);
    if (error) {
      console.error("memberships error", error);
      setMemberships([]);
      return;
    }
    const mems = (data ?? []) as unknown as Membership[];
    setMemberships(mems);
    // Pick active
    const stored = typeof window !== "undefined" ? localStorage.getItem("sm_active_restaurant") : null;
    const found = mems.find((m) => m.restaurant_id === stored);
    if (found) setActiveId(found.restaurant_id);
    else if (mems[0]) setActiveId(mems[0].restaurant_id);
    else setActiveId(null);
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer to avoid deadlock
        setTimeout(() => void fetchMemberships(sess.user.id), 0);
      } else {
        setMemberships([]);
        setActiveId(null);
      }
    });

    // THEN check existing
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) void fetchMemberships(sess.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshMemberships = async () => {
    if (user) await fetchMemberships(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        memberships,
        activeRestaurantId,
        setActiveRestaurantId,
        refreshMemberships,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useActiveMembership() {
  const { memberships, activeRestaurantId } = useAuth();
  return memberships.find((m) => m.restaurant_id === activeRestaurantId) ?? null;
}
