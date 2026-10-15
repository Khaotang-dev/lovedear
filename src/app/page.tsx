"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  buildLoveEmailHtml,
  type LoveEmailImageLayout,
  type LoveEmailTheme,
} from "@/lib/love-email";

type SendMode = "now" | "draft";

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
  "แค่มีเธออยู่ข้าง ๆ วันธรรมดาของเราก็กลายเป็นวันที่พิเศษเสมอ\n\nขอบคุณที่เป็นรอยยิ้ม เป็นกำลังใจ และเป็นบ้านที่อบอุ่นที่สุดของเรานะ รักเธอมากกว่าที่คำพูดจะบอกได้เลย \n\nแค่มีเธออยู่ข้าง ๆ เราก็เปลี่ยนไปเยอะมากๆ เลย ได้เรียนรู้หลายๆอย่าง ขอบคุณที่เป็นรอยยิ้ม เป็นกำลังใจ และเป็นบ้านที่อบอุ่นที่สุดของเรานะ รักเธอมากกว่าที่คำพูดจะบอกได้เลย";

const maxImageFileSize = 10 * 1024 * 1024;
const maxProcessedPhotoDataLength = 1_333_359;
const maxPhotoCount = 4;

const imageLayouts: {
  id: LoveEmailImageLayout;
  label: string;
  description: string;
  ratio: number;
}[] = [
  {
    id: "landscape",
    label: "ภาพกว้าง",
    description: "เหมาะกับภาพวิว",
    ratio: 3 / 2,
  },
  {
    id: "square",
    label: "จัตุรัส",
    description: "พอดี ดูสมดุล",
    ratio: 1,
  },
  {
    id: "portrait",
    label: "แนวตั้ง",
    description: "เน้นภาพบุคคล",
    ratio: 4 / 5,
  },
];

type PhotoTemplateId =
  | "single"
  | "duo"
  | "large-two-small"
  | "strip-three"
  | "large-three-small"
  | "grid-four";

type PhotoTemplate = {
  id: PhotoTemplateId;
  label: string;
  description: string;
  photoCount: number;
  width: number;
  height: number;
  cells: { x: number; y: number; width: number; height: number }[];
};

const photoTemplates: PhotoTemplate[] = [
  {
    id: "single",
    label: "ภาพเดี่ยว",
    description: "ใช้ 1 รูป · ครอปพร้อมกรอบ",
    photoCount: 1,
    width: 1200,
    height: 800,
    cells: [{ x: 0, y: 0, width: 1, height: 1 }],
  },
  {
    id: "duo",
    label: "2 รูปเคียงกัน",
    description: "ใช้ 2 รูป",
    photoCount: 2,
    width: 1200,
    height: 800,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: "large-two-small",
    label: "1 ใหญ่ + 2 เล็ก",
    description: "ใช้ 3 รูป",
    photoCount: 3,
    width: 1200,
    height: 800,
    cells: [
      { x: 0, y: 0, width: 0.62, height: 1 },
      { x: 0.62, y: 0, width: 0.38, height: 0.5 },
      { x: 0.62, y: 0.5, width: 0.38, height: 0.5 },
    ],
  },
  {
    id: "strip-three",
    label: "Photo booth",
    description: "แถบ 3 รูป · ใช้ 3 รูป",
    photoCount: 3,
    width: 600,
    height: 1800,
    cells: [
      { x: 0, y: 0, width: 1, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 1, height: 1 / 3 },
    ],
  },
  {
    id: "large-three-small",
    label: "1 ใหญ่ + 3 เล็ก",
    description: "ใช้ 4 รูป",
    photoCount: 4,
    width: 1200,
    height: 900,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.66 },
      { x: 0, y: 0.66, width: 1 / 3, height: 0.34 },
      { x: 1 / 3, y: 0.66, width: 1 / 3, height: 0.34 },
      { x: 2 / 3, y: 0.66, width: 1 / 3, height: 0.34 },
    ],
  },
  {
    id: "grid-four",
    label: "ตาราง 2 × 2",
    description: "ใช้ 4 รูป",
    photoCount: 4,
    width: 1000,
    height: 1000,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
];

async function cropImage(
  file: File,
  layout: LoveEmailImageLayout,
  horizontalPosition: number,
  verticalPosition: number,
) {
  const bitmap = await createImageBitmap(file);
  const ratio = imageLayouts.find((item) => item.id === layout)?.ratio ?? 1;
  const cropWidth = Math.min(bitmap.width, bitmap.height * ratio);
  const cropHeight = cropWidth / ratio;
  const sourceX = (bitmap.width - cropWidth) * (horizontalPosition / 100);
  const sourceY = (bitmap.height - cropHeight) * (verticalPosition / 100);
  const outputWidth = Math.max(1, Math.round(Math.min(1200, cropWidth)));
  const outputHeight = Math.max(1, Math.round(outputWidth / ratio));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("เตรียมรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  }

  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function composePhotoTemplate(
  files: File[],
  template: PhotoTemplate,
) {
  if (files.length !== template.photoCount) {
    throw new Error("จำนวนรูปไม่ตรงกับเทมเพลตที่เลือก");
  }

  const bitmaps: ImageBitmap[] = [];
  try {
    for (const file of files) {
      bitmaps.push(await createImageBitmap(file));
    }

    const canvas = document.createElement("canvas");
    canvas.width = template.width;
    canvas.height = template.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("เตรียมรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }

    context.fillStyle = "#fffdfb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const gutter = Math.max(8, Math.round(Math.min(canvas.width, canvas.height) * 0.012));

    template.cells.forEach((cell, index) => {
      const bitmap = bitmaps[index];
      if (!bitmap) return;

      const left = Math.round(cell.x * canvas.width) + gutter;
      const top = Math.round(cell.y * canvas.height) + gutter;
      const width = Math.round(cell.width * canvas.width) - gutter * 2;
      const height = Math.round(cell.height * canvas.height) - gutter * 2;
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      const sourceX = (bitmap.width - sourceWidth) / 2;
      const sourceY = (bitmap.height - sourceHeight) / 2;

      context.drawImage(
        bitmap,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        left,
        top,
        width,
        height,
      );
    });

    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    bitmaps.forEach((bitmap) => bitmap.close());
  }
}

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [to, setTo] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("มีบางอย่างอยากบอกเธอ 💌");
  const [message, setMessage] = useState(initialMessage);
  const [signature, setSignature] = useState("รักเสมอ, คนของเธอ");
  const [theme, setTheme] = useState<LoveEmailTheme>("rose");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageLayout, setImageLayout] =
    useState<LoveEmailImageLayout>("landscape");
  const [photoTemplate, setPhotoTemplate] = useState<PhotoTemplateId | null>(
    null,
  );
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [isCropping, setIsCropping] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
    actionHref?: string;
    actionLabel?: string;
  } | null>(null);
  const imageFilesRef = useRef<File[]>([]);
  const cropRequestRef = useRef(0);

  const emailHtml = useMemo(
    () =>
      buildLoveEmailHtml({
        recipientName,
        message,
        signature,
        theme,
        imageSrc: imageData ?? undefined,
      }),
    [recipientName, message, signature, theme, imageData],
  );
  const selectedPhotoTemplate = photoTemplates.find(
    (template) => template.id === photoTemplate,
  );

  async function updatePhotoPreview(
    files: File[],
    templateId: PhotoTemplateId,
    layout = imageLayout,
    position = imagePosition,
  ) {
    const requestId = ++cropRequestRef.current;
    setIsCropping(true);
    try {
      const template = photoTemplates.find((item) => item.id === templateId);
      if (!template) {
        throw new Error("ไม่พบเทมเพลตรูปภาพที่เลือก");
      }
      if (files.length !== template.photoCount) {
        throw new Error(`เทมเพลตนี้ต้องใช้รูป ${template.photoCount} รูป`);
      }
      let image: string;
      if (templateId === "single") {
        const file = files[0];
        if (!file) throw new Error("เลือกรูปภาพก่อนจัดวาง");
        image = await cropImage(file, layout, position.x, position.y);
      } else {
        image = await composePhotoTemplate(files, template);
      }
      if (requestId !== cropRequestRef.current) return;
      if (image.length > maxProcessedPhotoDataLength) {
        throw new Error(
          "รูปที่จัดวางแล้วยังมีขนาดใหญ่เกินไป ลองเลือกรูปที่มีขนาดเล็กลงนะ",
        );
      }
      setImageData(image);
      setNotice(null);
    } catch (error) {
      if (requestId !== cropRequestRef.current) return;
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "เปิดรูปภาพไม่สำเร็จ กรุณาลองเลือกรูปอื่นนะ",
      });
    } finally {
      if (requestId === cropRequestRef.current) setIsCropping(false);
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;
    if (!photoTemplate) {
      setNotice({ type: "error", text: "เลือกเทมเพลตก่อนอัปโหลดรูปนะ" });
      return;
    }

    const files = [...imageFilesRef.current, ...selectedFiles];
    const requiredPhotoCount =
      photoTemplates.find((template) => template.id === photoTemplate)
        ?.photoCount ?? 0;
    if (files.length > requiredPhotoCount) {
      setNotice({
        type: "error",
        text: `เทมเพลตนี้ใช้ ${requiredPhotoCount} รูป กรุณาเลือกรูปเพิ่มไม่เกินจำนวนนี้นะ`,
      });
      return;
    }
    if (
      selectedFiles.some(
        (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
    ) {
      setNotice({ type: "error", text: "เลือกรูป JPG, PNG หรือ WebP นะ" });
      return;
    }
    if (selectedFiles.some((file) => file.size > maxImageFileSize)) {
      setNotice({ type: "error", text: "รูปต้นฉบับต้องมีขนาดไม่เกิน 10 MB นะ" });
      return;
    }

    imageFilesRef.current = files;
    setImageFiles(files);
    setImageData(null);
    setNotice(null);
    setImagePosition({ x: 50, y: 50 });
    if (files.length === requiredPhotoCount) {
      await updatePhotoPreview(files, photoTemplate, imageLayout, { x: 50, y: 50 });
    }
  }

  function handlePhotoTemplateChange(template: PhotoTemplateId) {
    const photoCount = photoTemplates.find((item) => item.id === template)?.photoCount;
    if (photoCount === undefined) {
      setNotice({ type: "error", text: "ไม่พบเทมเพลตรูปภาพที่เลือก" });
      return;
    }
    setPhotoTemplate(template);
    if (imageFiles.length === photoCount) {
      setNotice(null);
      setImageData(null);
      if (template === "single") {
        setImagePosition({ x: 50, y: 50 });
        void updatePhotoPreview(imageFiles, template, imageLayout, { x: 50, y: 50 });
      } else {
        void updatePhotoPreview(imageFiles, template);
      }
      return;
    }

    cropRequestRef.current += 1;
    setImageData(null);
    setIsCropping(false);
    if (imageFiles.length > 0) {
      setImageFiles([]);
      imageFilesRef.current = [];
      setNotice({
        type: "success",
        text: `เทมเพลตนี้ใช้ ${photoCount} รูป กรุณาอัปโหลดรูปใหม่ตามจำนวนนี้นะ`,
      });
    } else {
      setNotice(null);
    }
    setImagePosition({ x: 50, y: 50 });
  }

  function handleImageLayoutChange(layout: LoveEmailImageLayout) {
    setImageLayout(layout);
    setImagePosition({ x: 50, y: 50 });
    if (imageFiles.length === 1 && photoTemplate === "single") {
      void updatePhotoPreview(imageFiles, "single", layout, { x: 50, y: 50 });
    }
  }

  function handleImagePositionChange(axis: "x" | "y", value: number) {
    const nextPosition = { ...imagePosition, [axis]: value };
    setImagePosition(nextPosition);
    if (imageFiles.length === 1 && photoTemplate === "single") {
      void updatePhotoPreview(imageFiles, "single", imageLayout, nextPosition);
    }
  }

  function removeImage(index: number) {
    const files = imageFilesRef.current.filter((_, fileIndex) => fileIndex !== index);
    imageFilesRef.current = files;
    setImageFiles(files);
    cropRequestRef.current += 1;
    setImageData(null);
    setIsCropping(false);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (
      selectedPhotoTemplate &&
      imageFiles.length > 0 &&
      (imageFiles.length !== selectedPhotoTemplate.photoCount || !imageData)
    ) {
      setNotice({
        type: "error",
        text: `เทมเพลตที่เลือกต้องใช้รูป ${selectedPhotoTemplate.photoCount} รูป กรุณาอัปโหลดให้ครบก่อนส่งนะ`,
      });
      return;
    }

    if (!session?.user?.email) {
      setNotice({
        type: "error",
        text: "เข้าสู่ระบบ Google ก่อนส่งหรือบันทึกร่างผ่าน Gmail นะ",
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
          saveDraft: sendMode === "draft",
          ...(imageData ? { image: imageData } : {}),
        }),
      });
      const result: { error?: string; id?: string; draftId?: string; gmailUrl?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "ส่งอีเมลไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      }

      if (sendMode === "draft") {
        setNotice({
          type: "success",
          text: "บันทึกร่างไว้ใน Gmail แล้ว เปิดร่าง จากนั้นกดลูกศรข้างปุ่มส่งและเลือก “ตั้งเวลาส่ง”",
          actionHref: result.gmailUrl ?? "https://mail.google.com/mail/u/0/#drafts",
          actionLabel: "เปิด Gmail Drafts",
        });
      } else {
        setNotice({
          type: "success",
          text: "ส่งอีเมลบอกรักเรียบร้อยแล้ว 💌",
        });
      }
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
              placeholder="รีมายด์คนเก่ง"
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

          <fieldset className="image-picker">
            <legend className="field-label">เพิ่มรูปถ่ายในจดหมาย</legend>
            <p className="image-picker-hint">
              เลือกเทมเพลตก่อน แล้วอัปโหลดรูปให้ครบตามจำนวนช่อง (สูงสุด {maxPhotoCount} รูป)
            </p>
            <div className="photo-template-options" aria-label="เลือกเทมเพลตรูปถ่าย">
              {photoTemplates.map((template) => (
                <button
                  aria-pressed={photoTemplate === template.id}
                  className={`photo-template-option ${photoTemplate === template.id ? "is-selected" : ""}`}
                  key={template.id}
                  onClick={() => handlePhotoTemplateChange(template.id)}
                  type="button"
                >
                  <span
                    className={`photo-template-swatch ${template.id}`}
                    aria-hidden="true"
                  >
                    {Array.from({ length: template.photoCount }, (_, index) => (
                      <i key={index} />
                    ))}
                  </span>
                  <strong>{template.label}</strong>
                  <small>{template.description}</small>
                </button>
              ))}
            </div>

            {!photoTemplate ? (
              <p className="photo-template-hint">
                เลือกเทมเพลตเพื่อเริ่มเพิ่มรูปภาพ
              </p>
            ) : (
              <>
                <label
                  className={`image-upload ${imageFiles.length >= (selectedPhotoTemplate?.photoCount ?? 0) ? "is-disabled" : ""}`}
                  htmlFor="letter-image"
                >
                  <span className="image-upload-icon" aria-hidden="true">＋</span>
                  <span>
                    <strong>
                      {imageFiles.length === selectedPhotoTemplate?.photoCount
                        ? "เลือกรูปครบแล้ว"
                        : imageFiles.length
                          ? "เพิ่มรูปภาพ"
                          : `เลือกรูปภาพ ${selectedPhotoTemplate?.photoCount} รูป`}
                    </strong>
                    <small>
                      JPG, PNG หรือ WebP · ไม่เกิน 10 MB ต่อรูป
                    </small>
                  </span>
                  <input
                    id="letter-image"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void handleImageChange(event)}
                    disabled={imageFiles.length >= (selectedPhotoTemplate?.photoCount ?? 0)}
                    multiple
                    type="file"
                  />
                </label>

                {imageFiles.length > 0 && (
                  <div className="uploaded-photo-list">
                    {imageFiles.map((file, index) => (
                      <div className="image-file-row" key={`${file.name}-${index}`}>
                        <span title={file.name}>
                          รูปที่ {index + 1}: {file.name}
                        </span>
                        <button
                          aria-label={`นำรูปที่ ${index + 1} ออก`}
                          onClick={() => removeImage(index)}
                          type="button"
                        >
                          นำออก
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imageFiles.length < (selectedPhotoTemplate?.photoCount ?? 0) && (
                  <p className="photo-template-hint">
                    อัปโหลดเพิ่มอีก{" "}
                    {(selectedPhotoTemplate?.photoCount ?? 0) - imageFiles.length}{" "}
                    รูปเพื่อแสดงตัวอย่าง
                  </p>
                )}

                {isCropping && (
                  <p className="photo-template-hint" role="status">
                    กำลังจัดวางรูปภาพ...
                  </p>
                )}

                {imageData && (
                  <div className="image-editor">
                    <div
                      className={`image-crop-preview ${photoTemplate === "single" ? imageLayout : photoTemplate}`}
                    >
                      {/* This image mirrors the composed image embedded in the email. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageData}
                        alt={`ตัวอย่างเลย์เอาต์รูปถ่าย ${imageFiles.length} รูป`}
                      />
                    </div>

                    {photoTemplate === "single" && (
                      <>
                        <div className="image-layout-options" aria-label="เลือกรูปแบบกรอบ">
                          {imageLayouts.map((layout) => (
                            <button
                              aria-pressed={imageLayout === layout.id}
                              className={`image-layout-option ${imageLayout === layout.id ? "is-selected" : ""}`}
                              key={layout.id}
                              onClick={() => handleImageLayoutChange(layout.id)}
                              type="button"
                            >
                              <span
                                className={`image-layout-icon ${layout.id}`}
                                aria-hidden="true"
                              />
                              <strong>{layout.label}</strong>
                              <small>{layout.description}</small>
                            </button>
                          ))}
                        </div>

                        <div className="crop-controls">
                          <label htmlFor="crop-horizontal">
                            <span>เลื่อนภาพซ้าย–ขวา</span>
                            <input
                              id="crop-horizontal"
                              type="range"
                              min="0"
                              max="100"
                              value={imagePosition.x}
                              onChange={(event) =>
                                handleImagePositionChange("x", Number(event.target.value))
                              }
                            />
                          </label>
                          <label htmlFor="crop-vertical">
                            <span>เลื่อนภาพขึ้น–ลง</span>
                            <input
                              id="crop-vertical"
                              type="range"
                              min="0"
                              max="100"
                              value={imagePosition.y}
                              onChange={(event) =>
                                handleImagePositionChange("y", Number(event.target.value))
                              }
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </fieldset>

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
                className={`send-mode ${sendMode === "draft" ? "is-active" : ""}`}
              >
                <input
                  type="radio"
                  name="send-mode"
                  value="draft"
                  checked={sendMode === "draft"}
                  onChange={() => setSendMode("draft")}
                />
                <span className="radio-mark" />
                <span>
                  <strong>บันทึกร่างเพื่อตั้งเวลาส่ง</strong>
                  <small>บันทึกร่างใน Gmail แล้วเลือกเวลาส่งใน Gmail</small>
                </span>
                <span className="mode-emoji" aria-hidden="true">
                  🕰️
                </span>
              </label>
            </div>
            {sendMode === "draft" && (
              <div className="schedule-hint">
                Gmail API ตั้งเวลาส่งแทนคุณไม่ได้ หลังบันทึกร่างแล้วเปิด Gmail
                กดลูกศรข้างปุ่ม “ส่ง” และเลือก “ตั้งเวลาส่ง”
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
              <span className="notice-copy">
                {notice.text}
                {notice.actionHref && notice.actionLabel && (
                  <a
                    className="notice-action"
                    href={notice.actionHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {notice.actionLabel}
                  </a>
                )}
              </span>
            </div>
          )}

          <button
            className="send-button"
            type="submit"
            disabled={isSending || isCropping}
          >
            <span>
              {isCropping
                ? "กำลังจัดรูปภาพ..."
                : isSending
                  ? sendMode === "draft"
                    ? "กำลังบันทึกร่างใน Gmail..."
                    : "กำลังส่งความรัก..."
                  : sendMode === "draft"
                    ? "บันทึกร่างใน Gmail"
                    : "ส่งความรักออกไป"}
            </span>
            <span className="send-button-icon" aria-hidden="true">
              {isSending || isCropping ? "…" : "↗"}
            </span>
          </button>
          <p className="privacy-note">
            <span aria-hidden="true">♡</span>
            {sendMode === "draft"
              ? session?.user?.email
                ? `บันทึกร่างใน Gmail ของ ${session.user.email}`
                : "เชื่อมต่อ Google เพื่อบันทึกร่างและตั้งเวลาส่งผ่าน Gmail"
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
