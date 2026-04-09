import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUser(user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  const signIn = (provider: "google" | "kakao") =>
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });

  const signOut = () => supabase.auth.signOut();

  return { user, signIn, signOut };
};
