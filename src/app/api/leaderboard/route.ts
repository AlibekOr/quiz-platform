import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { resolveLeaderboard } from "@/lib/leaderboard-access";

// GET /api/leaderboard?testId=&scope=group|all&groupId= (testId bo'lmasa umumiy reyting)
// groupId faqat o'qituvchi uchun; o'quvchida guruh sessiyadagi userdan (bazadan) olinadi
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const result = await resolveLeaderboard(user, {
    testId: params.get("testId"),
    scope: params.get("scope"),
    groupId: params.get("groupId"),
  });
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  return Response.json(
    {
      scope: result.scope,
      group: result.group,
      test: result.test,
      total: result.board.total,
      entries: result.board.entries,
      me: result.board.me,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
