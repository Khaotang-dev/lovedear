import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { buildLoveEmailHtml, type LoveEmailTheme } from "@/lib/love-email";
import { randomUUID } from "node:crypto";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxInlineImageBytes = 1_000_000;
const imageDataPrefix = "data:image/jpeg;base64,";
const maxInlineImageDataLength =
  imageDataPrefix.length + Math.ceil(maxInlineImageBytes / 3) * 4;
const themes: LoveEmailTheme[] = ["rose", "midnight", "sunshine"];
const isLoveEmailTheme = (value: unknown): value is LoveEmailTheme =>
  typeof value === "string" && themes.some((theme) => theme === value);

type SendLovePayload = {
  to?: unknown;
  subject?: unknown;
  recipientName?: unknown;
  message?: unknown;
  signature?: unknown;
  theme?: unknown;
  saveDraft?: unknown;
  image?: unknown;
};

function isSendLovePayload(value: unknown): value is SendLovePayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  if (!isSendLovePayload(body)) {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const payload = body;
  const {
    to,
    subject,
    recipientName,
    message,
    signature,
    theme,
    saveDraft,
    image,
  } = payload;
  if (
    typeof to !== "string" ||
    to.length > 254 ||
    !emailPattern.test(to.trim())
  ) {
    return NextResponse.json(
      { error: "กรุณาตรวจสอบอีเมลผู้รับอีกครั้ง" },
      { status: 400 },
    );
  }
  if (
    typeof subject !== "string" ||
    !subject.trim() ||
    subject.length > 180 ||
    typeof recipientName !== "string" ||
    recipientName.length > 80 ||
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 4000 ||
    typeof signature !== "string" ||
    signature.length > 120 ||
    !isLoveEmailTheme(theme)
  ) {
    return NextResponse.json(
      { error: "กรุณาตรวจสอบหัวข้อและเนื้อหาอีเมลอีกครั้ง" },
      { status: 400 },
    );
  }
  if (saveDraft !== undefined && typeof saveDraft !== "boolean") {
    return NextResponse.json(
      { error: "รูปแบบการบันทึกอีเมลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (
    typeof image === "string" &&
    image.length > maxInlineImageDataLength
  ) {
    return NextResponse.json(
      { error: "รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่เล็กลง" },
      { status: 413 },
    );
  }

  const imageData =
    typeof image === "string"
      ? /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(image)?.[1]
      : undefined;
  if (image !== undefined && !imageData) {
    return NextResponse.json(
      { error: "รูปภาพไม่ถูกต้อง กรุณาเลือกรูปใหม่อีกครั้ง" },
      { status: 400 },
    );
  }
  const imageBuffer = imageData ? Buffer.from(imageData, "base64") : null;
  if (
    imageBuffer &&
    (imageBuffer.byteLength > maxInlineImageBytes || imageBuffer.byteLength === 0)
  ) {
    return NextResponse.json(
      { error: "รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่เล็กลง" },
      { status: 413 },
    );
  }
  const html = buildLoveEmailHtml({
    recipientName,
    message,
    signature,
    theme,
    imageSrc: imageData ? "cid:letter-image" : undefined,
  });

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (
    !token ||
    typeof token.email !== "string" ||
    !token.email ||
    typeof token.refreshToken !== "string"
  ) {
    return NextResponse.json(
      { error: "เข้าสู่ระบบ Google เพื่อส่งจดหมายผ่าน Gmail ก่อนนะ" },
      { status: 401 },
    );
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Google OAuth is not configured.");
    return NextResponse.json(
      { error: "ระบบเชื่อมต่อ Google ยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแลระบบ" },
      { status: 503 },
    );
  }

  let accessToken = token.accessToken;
  if (
    typeof accessToken !== "string" ||
    typeof token.accessTokenExpires !== "number" ||
    token.accessTokenExpires <= Date.now() + 60_000
  ) {
    let refreshResponse: Response;
    try {
      refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: token.refreshToken,
          grant_type: "refresh_token",
        }),
      });
    } catch (error) {
      console.error("Unable to refresh Google authorization.", error);
      return NextResponse.json(
        { error: "เชื่อมต่อ Google ไม่ได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 502 },
      );
    }

    const refreshed: unknown = await refreshResponse.json().catch(() => null);
    if (
      !refreshResponse.ok ||
      typeof refreshed !== "object" ||
      refreshed === null ||
      !("access_token" in refreshed) ||
      typeof refreshed.access_token !== "string"
    ) {
      console.error("Google rejected an access-token refresh.", {
        status: refreshResponse.status,
      });
      return NextResponse.json(
        { error: "การเชื่อมต่อ Google หมดอายุแล้ว กรุณาออกจากระบบแล้วเชื่อมต่อใหม่" },
        { status: 401 },
      );
    }
    accessToken = refreshed.access_token;
  }

  const encodedSubject = Buffer.from(subject.trim(), "utf8").toString("base64");
  const encodedHtml = Buffer.from(html, "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n")
    .trimEnd();
  const messageHeaders = [
    `From: ${token.email}`,
    `To: ${to.trim()}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
  ];
  let mimeMessage: string;
  if (imageData) {
    const boundary = `dearly-${randomUUID()}`;
    const encodedImage = imageData.replace(/.{1,76}/g, "$&\r\n").trimEnd();
    mimeMessage = [
      ...messageHeaders,
      `Content-Type: multipart/related; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodedHtml,
      `--${boundary}`,
      'Content-Type: image/jpeg; name="dearly-photo.jpg"',
      "Content-Transfer-Encoding: base64",
      "Content-ID: <letter-image>",
      'Content-Disposition: inline; filename="dearly-photo.jpg"',
      "",
      encodedImage,
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    mimeMessage = [
      ...messageHeaders,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodedHtml,
    ].join("\r\n");
  }

  const isDraft = saveDraft === true;
  let gmailResponse: Response;
  try {
    gmailResponse = await fetch(
      isDraft
        ? "https://gmail.googleapis.com/gmail/v1/users/me/drafts"
        : "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isDraft
            ? {
                message: {
                  raw: Buffer.from(mimeMessage, "utf8").toString("base64url"),
                },
              }
            : { raw: Buffer.from(mimeMessage, "utf8").toString("base64url") },
        ),
      },
    );
  } catch (error) {
    console.error("Unable to reach the Gmail API.", error);
    return NextResponse.json(
      { error: "เชื่อมต่อ Gmail ไม่ได้ กรุณาลองอีกครั้ง" },
      { status: 502 },
    );
  }

  if (!gmailResponse.ok) {
    console.error("Gmail API rejected a message.", {
      status: gmailResponse.status,
    });
    if (gmailResponse.status === 401) {
      return NextResponse.json(
        { error: "การเชื่อมต่อ Google หมดอายุแล้ว กรุณาออกจากระบบแล้วเชื่อมต่อใหม่" },
        { status: 401 },
      );
    }
    if (gmailResponse.status === 403) {
      return NextResponse.json(
        {
          error: isDraft
            ? "บัญชี Google ยังไม่ได้รับสิทธิ์บันทึกร่าง กรุณาออกจากระบบแล้วเชื่อมต่อ Google ใหม่"
            : "บัญชี Google ยังไม่ได้รับสิทธิ์ส่งอีเมล กรุณาเชื่อมต่อ Google ใหม่",
        },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "Gmail ส่งอีเมลไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 502 },
    );
  }

  let result: unknown;
  try {
    result = await gmailResponse.json();
  } catch (error) {
    console.error("Gmail API returned an invalid response.", error);
    return NextResponse.json(
      { error: "Gmail ตอบกลับไม่ถูกต้อง กรุณาลองอีกครั้ง" },
      { status: 502 },
    );
  }
  const messageId =
    typeof result === "object" &&
    result !== null &&
    "id" in result &&
    typeof result.id === "string"
      ? result.id
      : undefined;
  if (!messageId) {
    console.error("Gmail API response did not include a message ID.", {
      isDraft,
    });
    return NextResponse.json(
      { error: isDraft ? "Gmail บันทึกร่างไม่สำเร็จ กรุณาลองอีกครั้ง" : "Gmail ส่งอีเมลไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 502 },
    );
  }
  return NextResponse.json(
    isDraft
      ? {
          draftId: messageId,
          gmailUrl: "https://mail.google.com/mail/u/0/#drafts",
        }
      : { id: messageId },
    { status: 200 },
  );
}
