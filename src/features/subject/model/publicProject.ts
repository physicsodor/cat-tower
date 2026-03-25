import { supabase } from "@/features/auth/supabase";

export type PublicProject = {
  id: string;
  slug: string;
  title: string;
  data: string;
  updated_at: string;
};

export const EXAMPLE_SLUG = "example";

export function extractUrlSlug(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "");
  if (!normalized) return null;
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  return segments[segments.length - 1];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  return !!adminEmail && !!email && email === adminEmail;
}

export async function fetchPublicProjectBySlug(slug: string): Promise<PublicProject | null> {
  const { data } = await supabase
    .from("public_projects")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as PublicProject | null) ?? null;
}

export async function savePublicProject(id: string, encoded: string): Promise<void> {
  await supabase
    .from("public_projects")
    .update({ data: encoded, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function createPublicProject(
  slug: string,
  title: string,
  encoded: string
): Promise<PublicProject | null> {
  const { data } = await supabase
    .from("public_projects")
    .insert({ slug, title, data: encoded })
    .select()
    .single();
  return (data as PublicProject | null) ?? null;
}

export async function deletePublicProject(id: string): Promise<void> {
  await supabase.from("public_projects").delete().eq("id", id);
}

export async function updatePublicProject(
  id: string,
  slug: string,
  title: string
): Promise<void> {
  await supabase
    .from("public_projects")
    .update({ slug, title })
    .eq("id", id);
}

export async function listPublicProjects(): Promise<PublicProject[]> {
  const { data } = await supabase
    .from("public_projects")
    .select("*")
    .order("slug", { ascending: true });
  return (data ?? []) as PublicProject[];
}
