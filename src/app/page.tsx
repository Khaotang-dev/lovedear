"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { buildLoveEmailHtml, type LoveEmailTheme } from "@/lib/love-email";

type SendMode = "now" | "scheduled";

const themes: {
  id: LoveEmailTheme;
  label: string;
  description: string;
  swatch: string;
}[] = [
  {
    id: "rose",
    label: "Rose garden",
    description: "หวานละมุน โรแมนติก",
    swatch: "rose",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "อบอุ่นเหมือนคืนดาวเต็มฟ้า",
    swatch: "midnight",
  },
  {
    id: "sunshine",
    label: "Sunshine",
    description: "สดใสเหมือนวันแรกที่เจอกัน",
    swatch: "sunshine",
  },
];

const initialMessage =
  "แค่มีเธออยู่ข้าง ๆ วันธรรมดาของเราก็กลายเป็นวันที่พิเศษเสมอ\n\nขอบคุณที่เป็นรอยยิ้ม เป็นกำลังใจ และเป็นบ้านที่อบอุ่นที่สุดของเรานะ รักเธอมากกว่าที่คำพูดจะบอกได้เลย";

const maxScheduleOffsetMs = 30 * 24 * 60 * 60 * 1000;

function getMinScheduleValue() {
  const date = new Date(Date.now() + 60_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function getMaxScheduleValue() {
  const date = new Date(Date.now() + maxScheduleOffsetMs);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [to, setTo] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("มีบางอย่างอยากบอกเธอ 💌");
  const [message, setMessage] = useState(initialMessage);
  const [signature, setSignature] = useState("รักเสมอ, คนของเธอ");
  const [theme, setTheme] = useState<LoveEmailTheme>("rose");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const emailHtml = useMemo(
    () =>
      buildLoveEmailHtml({
        recipientName,
        message,
        signature,
        theme,
      }),
    [recipientName, message, signature, theme],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    let scheduledAtIso: string | undefined;
    if (sendMode === "scheduled") {
      if (!scheduledAt) {
        setNotice({ type: "error", text: "เลือกวันและเวลาที่ต้องการส่งก่อนนะ" });
        return;
      }

      const scheduledDate = new Date(scheduledAt);
      if (
        Number.isNaN(scheduledDate.getTime()) ||
        scheduledDate.getTime() <= Date.now()
      ) {
        setNotice({
          type: "error",
          text: "เวลาที่ตั้งไว้ต้องเป็นเวลาในอนาคต",
        });
        return;
      }
      if (scheduledDate.getTime() > Date.now() + maxScheduleOffsetMs) {
        setNotice({
          type: "error",
          text: "ตั้งเวลาส่งล่วงหน้าได้ไม่เกิน 30 วัน",
        });
        return;
      }
      scheduledAtIso = scheduledDate.toISOString();
    } else if (!session?.user?.email) {
      setNotice({
        type: "error",
        text: "เข้าสู่ระบบ Google ก่อนส่งจดหมายผ่าน Gmail นะ",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-love", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          recipientName,
          message,
          signature,
          theme,
          ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
        }),
      });
      const result: { error?: string; id?: string; scheduledAt?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "ส่งอีเมลไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      }

      const confirmation = scheduledAtIso
        ? `ตั้งเวลาส่งให้แล้ว 💌 (${new Date(scheduledAtIso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })})`
        : "ส่งอีเมลบอกรักเรียบร้อยแล้ว 💌";
      setNotice({ type: "success", text: confirmation });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "ส่งอีเมลไม่สำเร็จ ลองใหม่อีกครั้งนะ",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Dearly หน้าแรก">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9Z"
                fill="currentColor"
              />
            </svg>
          </span>
          dearly<span className="brand-period">.</span>
        </Link>
        <div className="topbar-actions">
          <span className="topbar-note">
            <span className="status-dot" />
            made with a little extra love
          </span>
          {authStatus === "loading" ? (
            <span className="auth-loading">กำลังตรวจสอบ...</span>
          ) : session?.user?.email ? (
            <div className="auth-controls">
              <span className="google-account" title={session.user.email}>
                {session.user.email}
              </span>
              <button
                className="auth-button"
                onClick={() => void signOut()}
                type="button"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <button
              className="auth-button"
              onClick={() => void signIn("google")}
              type="button"
            >
              เชื่อมต่อ Google
            </button>
          )}
        </div>
      </header>

      <section className="intro">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          A LITTLE NOTE, A LOT OF LOVE
        </div>
        <h1>
          บางความรู้สึก
          <br />
          <span>ก็อยากส่งให้ถึงใจ</span>
        </h1>
        <p>
          เขียนคำบอกรักในแบบของคุณ เลือกดีไซน์ที่ใช่
          <br className="desktop-break" /> แล้วส่งให้คนพิเศษได้เลย
        </p>
      </section>

      <form className="workspace" onSubmit={handleSubmit}>
        <section className="editor-card" aria-labelledby="editor-title">
          <div className="card-heading">
            <div>
              <span className="step-label">YOUR LOVE LETTER</span>
              <h2 id="editor-title">เขียนจดหมายของคุณ</h2>
            </div>
            <span className="card-icon" aria-hidden="true">
              ✎
            </span>
          </div>

          <div className="form-section">
            <label className="field-label" htmlFor="recipient-email">
              ส่งถึงอีเมล <span className="required">*</span>
            </label>
            <input
              id="recipient-email"
              type="email"
              autoComplete="email"
              placeholder="someone@love.com"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              required
            />

            <label className="field-label spaced-label" htmlFor="recipient-name">
              เรียกเขาว่าอะไรดี?
            </label>
            <input
              id="recipient-name"
              type="text"
              maxLength={80}
              placeholder="ที่รัก, คนเก่ง..."
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />

            <label className="field-label spaced-label" htmlFor="email-subject">
              หัวข้ออีเมล
            </label>
            <input
              id="email-subject"
              type="text"
              maxLength={180}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
            />

            <div className="message-label-row">
              <label className="field-label" htmlFor="love-message">
                ข้อความจากใจ
              </label>
              <span className="handwritten-hint">เขียนจากใจได้เลย ♡</span>
            </div>
            <textarea
              id="love-message"
              rows={6}
              maxLength={4000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
            <div className="character-count">{message.length} / 4,000</div>

            <label className="field-label spaced-label" htmlFor="signature">
              ลงท้ายด้วย
            </label>
            <input
              id="signature"
              type="text"
              maxLength={120}
              value={signature}
              onChange={(event) => setSignature(event.target.value)}
            />
          </div>

          <div className="divider" />

          <fieldset className="theme-picker">
            <legend className="field-label">เลือกบรรยากาศ</legend>
            <div className="theme-options">
              {themes.map((option) => (
                <button
                  aria-pressed={theme === option.id}
                  className={`theme-option ${theme === option.id ? "is-selected" : ""}`}
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  type="button"
                >
                  <span className={`theme-swatch ${option.swatch}`}>
                    <span>♥</span>
                  </span>
                  <span className="theme-copy">
                    <span className="theme-name">{option.label}</span>
                    <span className="theme-description">
                      {option.description}
                    </span>
                  </span>
                  <span className="theme-check" aria-hidden="true">
                    ✓
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="divider" />

          <fieldset className="send-options">
            <legend className="field-label">จะส่งเมื่อไหร่ดี?</legend>
            <div className="send-mode-options">
              <label
                className={`send-mode ${sendMode === "now" ? "is-active" : ""}`}
              >
                <input
                  type="radio"
                  name="send-mode"
                  value="now"
                  checked={sendMode === "now"}
                  onChange={() => setSendMode("now")}
                />
                <span className="radio-mark" />
                <span>
                  <strong>ส่งเลย</strong>
                  <small>ให้ความรู้สึกส่งตรงถึงใจ</small>
                </span>
                <span className="mode-emoji" aria-hidden="true">
                  💌
                </span>
              </label>
              <label
                className={`send-mode ${sendMode === "scheduled" ? "is-active" : ""}`}
              >
                <input
                  type="radio"
                  name="send-mode"
                  value="scheduled"
                  checked={sendMode === "scheduled"}
                  onChange={() => setSendMode("scheduled")}
                />
                <span className="radio-mark" />
                <span>
                  <strong>ตั้งเวลาส่ง</strong>
                  <small>เซอร์ไพรส์ในเวลาที่ใช่</small>
                </span>
                <span className="mode-emoji" aria-hidden="true">
                  🕰️
                </span>
              </label>
            </div>
            {sendMode === "scheduled" && (
              <div className="schedule-field">
                <label className="field-label" htmlFor="schedule-time">
                  วันและเวลาที่ต้องการส่ง
                </label>
                <input
                  id="schedule-time"
                  type="datetime-local"
                  min={getMinScheduleValue()}
                  max={getMaxScheduleValue()}
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  required
                />
                <p className="schedule-hint">
                  เลือกเวลาในเขตเวลาของคุณ (ตั้งล่วงหน้าได้ไม่เกิน 30 วัน)
                </p>
              </div>
            )}
          </fieldset>

          {notice && (
            <div
              className={`notice ${notice.type}`}
              role={notice.type === "error" ? "alert" : "status"}
            >
              <span aria-hidden="true">
                {notice.type === "success" ? "♡" : "!"}
              </span>
              {notice.text}
            </div>
          )}

          <button className="send-button" type="submit" disabled={isSending}>
            <span>{isSending ? "กำลังส่งความรัก..." : "ส่งความรักออกไป"}</span>
            <span className="send-button-icon" aria-hidden="true">
              {isSending ? "…" : "↗"}
            </span>
          </button>
          <p className="privacy-note">
            <span aria-hidden="true">♡</span>
            {sendMode === "scheduled"
              ? "จดหมายที่ตั้งเวลาส่งจะจัดส่งผ่าน Resend"
              : session?.user?.email
                ? `ส่งจาก Gmail ของ ${session.user.email}`
                : "เชื่อมต่อ Google เพื่อส่งจดหมายจาก Gmail ของคุณ"}
          </p>
        </section>

        <aside className="preview-panel" aria-label="ตัวอย่างอีเมล">
          <div className="preview-heading">
            <div>
              <span className="step-label">THE LITTLE PREVIEW</span>
              <h2>หน้าตาจดหมายของคุณ</h2>
            </div>
            <span className="live-badge">
              <span className="status-dot" />
              LIVE
            </span>
          </div>
          <div className="email-window">
            <div className="window-bar">
              <div className="window-controls" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="window-label">your love letter</span>
              <span className="window-expand" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="email-meta">
              <div className="email-avatar" aria-hidden="true">
                ♡
              </div>
              <div className="email-meta-copy">
                <strong>ถึง: {to || "คนพิเศษของคุณ"}</strong>
                <span>หัวข้อ: {subject || "จดหมายจากใจ"}</span>
              </div>
              <span className="email-time">ตอนนี้</span>
            </div>
            <iframe
              className="email-preview"
              title="ตัวอย่างอีเมลบอกรัก"
              srcDoc={emailHtml}
              sandbox=""
            />
          </div>
          <p className="preview-caption">
            <span className="sparkle" aria-hidden="true">
              ✦
            </span>
            แก้ไขตรงไหน ตัวอย่างก็เปลี่ยนตามทันทีเลย
          </p>
          <div className="preview-footnote">
            <span className="footnote-heart">♡</span>
            <span>
              <strong>เขียนในแบบที่เป็นคุณ</strong>
              <small>จดหมายทุกฉบับไม่เหมือนกัน เหมือนความรักของคุณ</small>
            </span>
          </div>
        </aside>
      </form>

      <footer className="footer">
        <span>dearly.</span>
        <span>made for the moments that matter <span aria-hidden="true">♡</span></span>
      </footer>
    </main>
  );
}
