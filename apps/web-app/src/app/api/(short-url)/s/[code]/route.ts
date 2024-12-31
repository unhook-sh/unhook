import { redirect } from "next/navigation";

import { db } from "@acme/db/client";

export async function GET(request: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const shortUrl = await db.query.ShortUrl.findFirst({
    where: (shortUrls, { eq }) => eq(shortUrls.code, params.code),
    with: {
      script: true,
    },
  });

  if (!shortUrl) {
    return new Response("Not found", { status: 404 });
  }

  redirect(shortUrl.redirectUrl);
}
