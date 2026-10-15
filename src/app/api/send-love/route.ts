import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { buildLoveEmailHtml, type LoveEmailTheme } from "@/lib/love-email";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxScheduleOffsetMs = 30 * 24 * 60 * 60 * 1000;
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
  scheduledAt?: unknown;
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
    scheduledAt,
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

  let scheduledDate: Date | undefined;
  if (scheduledAt !== undefined) {
    if (typeof scheduledAt !== "string") {
      return NextResponse.json(
        { error: "วันและเวลาที่ตั้งไว้ไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    scheduledDate = new Date(scheduledAt);
    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "เวลาที่ตั้งไว้ต้องเป็นเวลาในอนาคต" },
        { status: 400 },
      );
    }
    if (scheduledDate.getTime() > Date.now() + maxScheduleOffsetMs) {
      return NextResponse.json(
        { error: "ตั้งเวลาส่งล่วงหน้าได้ไม่เกิน 30 วัน" },
        { status: 400 },
      );
    }
  }

  const html = buildLoveEmailHtml({
    recipientName,
    message,
    signature,
    theme,
  });

  if (scheduledDate) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error(
        "Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.",
      );
      return NextResponse.json(
        { error: "ระบบส่งอีเมลยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 503 },
      );
    }

    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to.trim()],
          subject: subject.trim(),
          html,
          scheduled_at: scheduledDate.toISOString(),
        }),
      });
    } catch (error) {
      console.error("Unable to reach the email provider.", error);
      return NextResponse.json(
        { error: "เชื่อมต่อระบบส่งอีเมลไม่ได้ กรุณาลองอีกครั้ง" },
        { status: 502 },
      );
    }

    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const providerMessage =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "ผู้ให้บริการอีเมลไม่สามารถส่งข้อความนี้ได้";
      console.error("Email provider rejected a message.", {
        status: response.status,
        message: providerMessage,
      });
      return NextResponse.json(
        { error: providerMessage },
        { status: response.status >= 400 && response.status < 500 ? 400 : 502 },
      );
    }

    const messageId =
      typeof result === "object" &&
      result !== null &&
      "id" in result &&
      typeof result.id === "string"
        ? result.id
        : undefined;
    return NextResponse.json(
      { id: messageId, scheduledAt: scheduledDate.toISOString() },
      { status: 200 },
    );
  }

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
  const mimeMessage = [
    `From: ${token.email}`,
    `To: ${to.trim()}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodedHtml,
  ].join("\r\n");

  let gmailResponse: Response;
  try {
    gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: Buffer.from(mimeMessage, "utf8").toString("base64url"),
        }),
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
        { error: "บัญชี Google ยังไม่ได้รับสิทธิ์ส่งอีเมล กรุณาเชื่อมต่อ Google ใหม่" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "Gmail ส่งอีเมลไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 502 },
    );
  }

  const result: unknown = await gmailResponse.json().catch(() => null);
  const messageId =
    typeof result === "object" &&
    result !== null &&
    "id" in result &&
    typeof result.id === "string"
      ? result.id
      : undefined;
  return NextResponse.json({ id: messageId }, { status: 200 });
}
