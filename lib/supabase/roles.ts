export type AppRole = "SUPER_ADMIN" | "BRANCH_ADMIN" | "MEMBER";

type RoleRecord = {
  role: AppRole;
  branch_id: number | null;
};

type RoleLookupResult = {
  data: RoleRecord | null;
  error: { code?: string; message?: string } | null;
};

async function readRole(
  supabase: any,
  table: "user_roles" | "profiles",
  idColumn: "user_id" | "id",
  userId: string
) {
  const { data, error } = (await supabase
    .from(table)
    .select("role, branch_id")
    .eq(idColumn, userId)
    .maybeSingle()) as RoleLookupResult;

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getUserRole(
  supabase: any,
  userId: string
): Promise<RoleRecord> {
  const userRolesResult = await readRole(supabase, "user_roles", "user_id", userId);

  if (userRolesResult.data?.role) {
    return userRolesResult.data;
  }

  const profilesResult = await readRole(supabase, "profiles", "id", userId);

  if (profilesResult.data?.role) {
    return profilesResult.data;
  }

  return {
    role: "MEMBER",
    branch_id: null,
  };
}

export function getRouteForRole(role: AppRole) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "BRANCH_ADMIN") return "/branch";
  return "/dashboard";
}
