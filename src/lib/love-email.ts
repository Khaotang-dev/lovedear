export type LoveEmailTheme = "rose" | "midnight" | "sunshine";
export type LoveEmailImageLayout = "landscape" | "square" | "portrait";
export type LoveEmailAnimation =
  | "none"
  | "float"
  | "pulse"
  | "twinkle"
  | "bounce"
  | "sway";
export type LoveEmailDecorationEmoji =
  | "💖" | "💕" | "💗" | "💘" | "💝" | "💌" | "✨" | "🌷" | "🌸" | "🌼"
  | "🐰" | "🐱" | "🧸" | "🦋" | "🎀" | "🍓" | "🧁" | "☁️" | "🌙";

export type LoveEmailContent = {
  recipientName: string;
  message: string;
  signature: string;
  theme: LoveEmailTheme;
  animation?: LoveEmailAnimation;
  decorationEmoji?: LoveEmailDecorationEmoji;
  imageSrc?: string;
};

const palettes: Record<
  LoveEmailTheme,
  { background: string; paper: string; accent: string; soft: string; ink: string; border: string }
> = {
  rose: {
    background: "#f9eeeb",
    paper: "#ffffff",
    accent: "#b94d68",
    soft: "#fdf5f5",
    ink: "#49353b",
    border: "#f0d5db",
  },
  midnight: {
    background: "#e9eaf5",
    paper: "#ffffff",
    accent: "#62679f",
    soft: "#f4f4fa",
    ink: "#30334e",
    border: "#d1d3e6",
  },
  sunshine: {
    background: "#fbf1dc",
    paper: "#ffffff",
    accent: "#c17a35",
    soft: "#fdf8ef",
    ink: "#544333",
    border: "#eeddbf",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function buildLoveEmailHtml({
  recipientName,
  message,
  signature,
  theme,
  animation = "float",
  decorationEmoji = "💖",
  imageSrc,
}: LoveEmailContent) {
  const palette = palettes[theme] ?? palettes.rose;
  const safeName = escapeHtml(recipientName.trim());
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const safeSignature = escapeHtml(signature).replace(/\r?\n/g, "<br>");
  const safeDecorationEmoji = escapeHtml(decorationEmoji);
  const animationClass = animation === "none" ? "" : `motion-${animation}`;

  const greeting = safeName ? `ถึง ${safeName} คนพิเศษ` : "ถึงคนพิเศษของเรา";

  // ฟังก์ชันช่วยสร้างแถบกรอบ Emoji เรียงต่อกัน
  const e = safeDecorationEmoji;
  const makeEmojiLine = (count: number, separator: string) =>
    Array(count).fill(`${e} ${separator}`).join(' ') + ` ${e}`;

  // สร้างกรอบรูปแบบต่างๆ (ปรับจำนวนให้พอดีกับหน้าจอมือถือ)
  const frameOuterLine = makeEmojiLine(6, '❀'); // 💖 ❀ 💖 ❀ 💖 ❀ 💖 ❀ 💖 ❀ 💖 ❀ 💖
  const frameInnerLine = makeEmojiLine(5, '✨'); // 💖 ✨ 💖 ✨ 💖 ✨ 💖 ✨ 💖 ✨ 💖
  const dividerLine = makeEmojiLine(3, '❀'); // 💖 ❀ 💖 ❀ 💖 ❀ 💖

  // เส้นคั่นแบบ Emoji ล้วน
  const emojiDivider = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
      <tr><td align="center" style="font-size: 14px; letter-spacing: 4px; color: ${palette.accent}; opacity: 0.8;">
        ${dividerLine}
      </td></tr>
    </table>
  `;

  // ส่วนแสดงรูปภาพ (มีกรอบ Emoji คั่นด้านบน)
  const imageSection = imageSrc
    ? `<tr><td align="center" style="padding-bottom: 24px;">
        <div style="margin-bottom: 16px; font-size: 14px; letter-spacing: 4px; color: ${palette.accent}; opacity: 0.8;">${dividerLine}</div>
        <img src="${escapeHtml(imageSrc)}" alt="Our Memory" style="display:block; width:100%; max-width:460px; height:auto; border:0; border-radius:16px; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>จดหมายจากใจ</title>
  <style>
    @keyframes float-up { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-7px) rotate(4deg); } }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
    @keyframes twinkle { 0%,100% { opacity: .6; transform: scale(.95); } 50% { opacity: 1; transform: scale(1.1); } }
    @keyframes bounce { 0%,100% { transform: translateY(0) scale(1); } 40% { transform: translateY(-8px) scale(1.05); } 65% { transform: translateY(0) scale(.98); } 82% { transform: translateY(-3px) scale(1.02); } }
    @keyframes sway { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
    
    .motion-float { animation: float-up 3.2s ease-in-out infinite; display: inline-block; }
    .motion-pulse { animation: pulse 1.7s ease-in-out infinite; display: inline-block; }
    .motion-twinkle { animation: twinkle 2.2s ease-in-out infinite; display: inline-block; }
    .motion-bounce { animation: bounce 1.8s ease-in-out infinite; display: inline-block; }
    .motion-sway { animation: sway 2.4s ease-in-out infinite; display: inline-block; }
    
    @media (prefers-reduced-motion: reduce) { 
      .motion-float,.motion-pulse,.motion-twinkle,.motion-bounce,.motion-sway { animation: none !important; } 
    }
    @media only screen and (max-width: 520px) { 
      .letter-wrap { padding: 32px 16px !important; } 
      .letter-card { padding: 32px 20px !important; } 
      .msg-body { font-size: 15px !important; }
      .emoji-frame { font-size: 12px !important; letter-spacing: 2px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:${palette.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:${palette.ink}; -webkit-font-smoothing: antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">💌 มีบางอย่างจากใจอยากส่งถึงคุณ... เปิดอ่านสิ 💖</div>
  
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; background:${palette.background}; min-height: 100vh;">
    <tr><td align="center" class="letter-wrap" style="padding: 60px 20px;">
      
      <!-- Pre-header Label -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; border-collapse:collapse;">
        <tr><td align="center" style="padding-bottom: 20px; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: ${palette.accent}; opacity: 0.8;">
          ❀ ${safeDecorationEmoji} a note of love ${safeDecorationEmoji} ❀
        </td></tr>
        
        <!-- Main Card -->
        <tr><td class="letter-card" style="background:${palette.paper}; border-radius: 24px; padding: 48px 40px; box-shadow: 0 24px 48px -12px rgba(0,0,0,0.06), 0 0 0 1px ${palette.border} inset;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            
            <!-- OUTER EMOJI FRAME (TOP) -->
            <tr><td align="center" class="emoji-frame" style="padding-bottom: 28px; font-size: 14px; letter-spacing: 4px; line-height: 1.5; color: ${palette.accent}; word-break: break-word;">
              ${frameOuterLine}
            </td></tr>

            <!-- Hero Icon -->
            <tr><td align="center" style="padding-bottom: 16px;">
              <span class="${animationClass}" style="font-size: 42px; line-height: 1;">${safeDecorationEmoji}</span>
            </td></tr>
            
            <!-- Greeting -->
            <tr><td align="center" style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.4; color: ${palette.accent}; font-weight: normal; margin: 0;">
              ${greeting}
            </td></tr>
            
            
            
            ${imageSection}
            
            <!-- INNER MESSAGE BOX WITH EMOJI FRAME -->
            <tr><td style="padding: 32px 24px; background: ${palette.soft}; border-radius: 16px; border: 1px dashed ${palette.border}; margin-top: 20px; display: block;">
              <!-- Message Frame Top -->
              <div class="emoji-frame" style="text-align: center; font-size: 13px; margin-bottom: 20px; letter-spacing: 3px; color: ${palette.accent}; opacity: 0.9;">
                 ${frameInnerLine}
              </div>
              
              <!-- Core Message -->
              <div class="msg-body" style="font-size: 16px; line-height: 1.9; color: ${palette.ink}; white-space: normal; text-align: center; font-weight: 400;">
                ${safeMessage}
              </div>
              
              <!-- Message Frame Bottom -->
              <div class="emoji-frame" style="text-align: center; font-size: 13px; margin-top: 20px; letter-spacing: 3px; color: ${palette.accent}; opacity: 0.9;">
                 ${frameInnerLine}
              </div>
            </td></tr>
            
            <tr><td>${emojiDivider}</td></tr>
            
            
            <!-- Signature -->
            <tr><td align="center" style="padding-bottom: 32px; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; color: ${palette.accent}; font-style: italic;">
              ${safeSignature || `รักเสมอ ${safeDecorationEmoji}`}
            </td></tr>

            <!-- OUTER EMOJI FRAME (BOTTOM) -->
            <tr><td align="center" class="emoji-frame" style="padding-bottom: 28px; font-size: 14px; letter-spacing: 4px; line-height: 1.5; color: ${palette.accent}; word-break: break-word;">
              ${frameOuterLine}
            </td></tr>

            <!-- Call to Action Button -->
            <tr><td align="center" style="padding-top: 10px;">
              <a href="https://www.google.com/" style="display: inline-block; background-color: ${palette.accent}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 600; letter-spacing: 1px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                ${safeDecorationEmoji} เก็บความรู้สึกนี้ไว้ ${safeDecorationEmoji}
              </a>
            </td></tr>
            
          </table>
        </td></tr>
        
        <!-- Footer -->
        <tr><td align="center" style="padding-top: 32px; font-size: 12px; letter-spacing: 1px; color: ${palette.ink}; opacity: 0.5;">
          Made with ❤️ By Khaotang
        </td></tr>
      </table>
      
    </td></tr>
  </table>
</body>
</html>`;
}