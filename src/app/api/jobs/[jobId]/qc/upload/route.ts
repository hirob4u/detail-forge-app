import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import { r2 } from "@/lib/r2";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDetailForgeOrgId(
    session.session.activeOrganizationId,
  );
  if (!orgId) {
    return NextResponse.json(
      { error: "No organization" },
      { status: 403 },
    );
  }

  // Verify job exists and belongs to org
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { area, fileType, fileSize } = body as {
    area: string;
    fileType: string;
    fileSize: number;
  };

  if (!ALLOWED_TYPES.has(fileType)) {
    return NextResponse.json(
      { error: "Invalid file type" },
      { status: 400 },
    );
  }

  if (fileSize > 20 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large" },
      { status: 400 },
    );
  }

  const ext = fileType.split("/")[1].replace("jpeg", "jpg");
  const key = `qc/${orgId}/${jobId}/${area}-${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  return NextResponse.json({ uploadUrl, key });
}
