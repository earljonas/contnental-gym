import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRouteForRole, getUserRole } from "@/lib/supabase/roles";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check user role to redirect appropriately
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const roleInfo = await getUserRole(supabase, user.id);
        const redirectTo = next === "/dashboard" ? getRouteForRole(roleInfo.role) : next;
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
