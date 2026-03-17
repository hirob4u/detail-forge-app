import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, organizations } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import { createPresignedGetUrl } from "@/lib/r2";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import type { OverlayOptions } from "sharp";
import path from "path";
import fs from "fs";

const anthropic = new Anthropic();

// Font path map for Sharp text compositing -- matches public/fonts/ directory
const FONT_PATHS: Record<string, string> = {
  "DM Sans": "dm-sans-700.ttf",
  Inter: "inter-700.ttf",
  Syne: "syne-700.ttf",
  Barlow: "barlow-700.ttf",
  Oswald: "oswald-700.ttf",
  "Bebas Neue": "bebas-neue-400.ttf",
  Montserrat: "montserrat-700.ttf",
};

function getFontPath(fontName: string): string {
  const file = FONT_PATHS[fontName] ?? FONT_PATHS["DM Sans"];
  return path.join(process.cwd(), "public", "fonts", file);
}

// Escape XML special characters for safe SVG text content
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(
  request: NextRequest,
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
      { error: "No active organization" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { photoKey } = body;

  if (!photoKey || typeof photoKey !== "string") {
    return NextResponse.json(
      { error: "photoKey is required" },
      { status: 400 },
    );
  }

  // Verify job belongs to org and is complete
  const [job] = await db
    .select({ id: jobs.id, stage: jobs.stage, orgId: jobs.orgId })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.stage !== "complete") {
    return NextResponse.json(
      { error: "Social export is only available for completed jobs" },
      { status: 403 },
    );
  }

  // Fetch org branding and toggle settings
  const [org] = await db
    .select({
      shopName: organizations.shopName,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
      nameFont: organizations.nameFont,
      plateBlockingEnabled: organizations.plateBlockingEnabled,
      watermarkEnabled: organizations.watermarkEnabled,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  // Fetch source photo from R2
  const photoUrl = await createPresignedGetUrl(photoKey);
  const photoRes = await fetch(photoUrl);
  if (!photoRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 },
    );
  }
  const photoBuffer = Buffer.from(await photoRes.arrayBuffer());

  // Get photo metadata
  const metadata = await sharp(photoBuffer).metadata();
  const imgWidth = metadata.width ?? 1920;
  const imgHeight = metadata.height ?? 1080;

  // Build composite layers
  const composites: OverlayOptions[] = [];
  const displayName = org.shopName ?? org.name;
  const accentColor = org.accentColor ?? "#7C4DFF";

  // ---- Plate blocking ----
  if (org.plateBlockingEnabled) {
    try {
      // Convert photo to base64 for Claude Vision
      const base64Photo = photoBuffer.toString("base64");
      const mimeType =
        metadata.format === "png" ? "image/png" : "image/jpeg";

      // Ask Claude Vision to locate the license plate
      const visionRes = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Photo,
                },
              },
              {
                type: "text",
                text: `Locate the license plate in this vehicle photo. If found, respond with ONLY a JSON object in this exact format with no other text:
{"found": true, "x": <left edge px>, "y": <top edge px>, "width": <width px>, "height": <height px>}
The coordinates must be in pixels relative to the image dimensions ${imgWidth}x${imgHeight}.
If no plate is visible, respond with: {"found": false}`,
              },
            ],
          },
        ],
      });

      const visionText =
        visionRes.content[0].type === "text"
          ? visionRes.content[0].text.trim()
          : '{"found": false}';

      let plateData: {
        found: boolean;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      } = { found: false };

      try {
        plateData = JSON.parse(visionText);
      } catch {
        plateData = { found: false };
      }

      if (
        plateData.found &&
        plateData.x !== undefined &&
        plateData.y !== undefined &&
        plateData.width !== undefined &&
        plateData.height !== undefined
      ) {
        const plateX = Math.max(0, Math.round(plateData.x));
        const plateY = Math.max(0, Math.round(plateData.y));
        const plateW = Math.min(
          Math.round(plateData.width),
          imgWidth - plateX,
        );
        const plateH = Math.min(
          Math.round(plateData.height),
          imgHeight - plateY,
        );

        // Pad the plate region slightly
        const padX = Math.round(plateW * 0.1);
        const padY = Math.round(plateH * 0.2);
        const blockX = Math.max(0, plateX - padX);
        const blockY = Math.max(0, plateY - padY);
        const blockW = Math.min(plateW + padX * 2, imgWidth - blockX);
        const blockH = Math.min(plateH + padY * 2, imgHeight - blockY);

        let plateBlocked = false;

        if (org.logoUrl) {
          // Logo composite -- fetch and resize to fit plate region
          try {
            const logoRes = await fetch(org.logoUrl);
            if (logoRes.ok) {
              const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
              const resizedLogo = await sharp(logoBuffer)
                .resize(blockW, blockH, {
                  fit: "contain",
                  background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                .png()
                .toBuffer();

              // Dark background behind logo
              const bgBlock = await sharp({
                create: {
                  width: blockW,
                  height: blockH,
                  channels: 4,
                  background: { r: 10, g: 10, b: 15, alpha: 230 },
                },
              })
                .png()
                .toBuffer();

              composites.push(
                { input: bgBlock, left: blockX, top: blockY },
                { input: resizedLogo, left: blockX, top: blockY },
              );
              plateBlocked = true;
            }
          } catch {
            // Logo fetch failed -- fall through to text fallback
          }
        }

        // Text fallback -- shop name in accent color on dark background
        if (!plateBlocked) {
          const fontSize = Math.max(16, Math.round(blockH * 0.45));
          const fontPath = getFontPath(org.nameFont ?? "DM Sans");
          const fontExists = fs.existsSync(fontPath);
          const escapedName = escapeXml(displayName);

          const svgText = `<svg width="${blockW}" height="${blockH}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${blockW}" height="${blockH}" fill="rgba(10,10,15,0.92)" rx="4"/>
            <text
              x="${blockW / 2}"
              y="${blockH / 2 + fontSize * 0.35}"
              font-family="${fontExists ? fontPath : "sans-serif"}"
              font-size="${fontSize}"
              font-weight="700"
              fill="${accentColor}"
              text-anchor="middle"
              dominant-baseline="middle"
            >${escapedName}</text>
          </svg>`;

          composites.push({
            input: Buffer.from(svgText),
            left: blockX,
            top: blockY,
          });
        }
      }
    } catch {
      // Vision call failed -- skip plate blocking, continue with watermark
    }
  }

  // ---- Watermark ----
  if (org.watermarkEnabled) {
    const watermarkFontSize = Math.max(
      20,
      Math.round(imgWidth * 0.022),
    );
    const padding = Math.round(watermarkFontSize * 0.8);
    const textWidth = Math.round(
      displayName.length * watermarkFontSize * 0.6,
    );
    const textHeight = Math.round(watermarkFontSize * 1.6);
    const wmX = imgWidth - textWidth - padding;
    const wmY = imgHeight - textHeight - padding;
    const escapedName = escapeXml(displayName);

    const wmSvg = `<svg width="${textWidth + padding}" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${textWidth + padding}" height="${textHeight}" fill="rgba(0,0,0,0.55)" rx="4"/>
      <text
        x="${(textWidth + padding) / 2}"
        y="${textHeight / 2 + watermarkFontSize * 0.35}"
        font-family="sans-serif"
        font-size="${watermarkFontSize}"
        font-weight="700"
        fill="${accentColor}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${escapedName}</text>
    </svg>`;

    composites.push({
      input: Buffer.from(wmSvg),
      left: Math.max(0, wmX),
      top: Math.max(0, wmY),
    });
  }

  // Apply composites and return processed JPEG
  let pipeline = sharp(photoBuffer);
  if (composites.length > 0) {
    pipeline = pipeline.composite(composites);
  }

  const outputBuffer = await pipeline.jpeg({ quality: 92 }).toBuffer();

  return new NextResponse(new Uint8Array(outputBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="detailforge-export.jpg"`,
      "Cache-Control": "no-store",
    },
  });
}
