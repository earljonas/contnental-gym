type MembershipStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "CANCELLED" | string;

type MembershipLike = {
  status: MembershipStatus;
  created_at?: string | null;
  end_date?: string | null;
};

function newestFirst<T extends MembershipLike>(memberships: T[]) {
  return [...memberships].sort((a, b) => {
    const aTime = new Date(a.created_at ?? 0).getTime();
    const bTime = new Date(b.created_at ?? 0).getTime();
    return bTime - aTime;
  });
}

export function pickCurrentMembership<T extends MembershipLike>(memberships: T[]) {
  const sorted = newestFirst(memberships);
  const active = sorted
    .filter((membership) => membership.status === "ACTIVE")
    .sort((a, b) => {
      const aEnd = new Date(a.end_date ?? 0).getTime();
      const bEnd = new Date(b.end_date ?? 0).getTime();
      return bEnd - aEnd;
    });

  return active[0] ?? sorted[0] ?? null;
}
