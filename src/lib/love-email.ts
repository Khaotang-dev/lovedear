export type LoveEmailTheme = "rose" | "midnight" | "sunshine";

export type LoveEmailContent = {
  recipientName: string;
  message: string;
  signature: string;
  theme: LoveEmailTheme;
};

const palettes: Record<
  LoveEmailTheme,
  { background: string; paper: string; accent: string; soft: string; ink: string }
> = {
  rose: {
    background: "#f9eeeb",
    paper: "#fffaf8",
    accent: "#b94d68",
    soft: "#f7e7e7",
    ink: "#49353b",
  },
  midnight: {
    background: "#e9eaf5",
    paper: "#fbfaff",
    accent: "#62679f",
    soft: "#ececf7",
    ink: "#30334e",
  },
  sunshine: {
    background: "#fbf1dc",
    paper: "#fffdf7",
    accent: "#c17a35",
    soft: "#fbefd8",
    ink: "#544333",
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
}: LoveEmailContent) {
  const palette = palettes[theme] ?? palettes.rose;
  const safeName = escapeHtml(recipientName.trim());
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const safeSignature = escapeHtml(signature).replace(/\r?\n/g, "<br>");
  const greeting = safeName ? `ถึง ${safeName} คนพิเศษของเรา` : "ถึงคนพิเศษของเรา";

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>จดหมายจากใจ</title>
  <style>
    @keyframes float-up { 0%,100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-7px) rotate(5deg); } }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
    .float-heart { animation: float-up 3.2s ease-in-out infinite; }
    .pulse-heart { animation: pulse 1.7s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .float-heart,.pulse-heart { animation: none !important; } }
    @media only screen and (max-width: 520px) { .letter-wrap { padding: 24px 16px !important; } .letter-card { padding: 36px 24px !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background:${palette.background};font-family:Georgia,'Times New Roman',serif;color:${palette.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">มีบางอย่างจากใจอยากส่งถึงคุณ ♡</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:${palette.background};">
    <tr><td align="center" class="letter-wrap" style="padding:48px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;border-collapse:collapse;">
        <tr><td align="center" style="padding:0 0 20px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${palette.accent};">a little note, a lot of love</td></tr>
        <tr><td class="letter-card" style="background:${palette.paper};border-radius:8px;padding:48px 52px;box-shadow:0 18px 55px rgba(60,35,45,.09);">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr><td align="center" style="padding-bottom:26px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
                <td class="float-heart" style="font-family:Arial,sans-serif;font-size:17px;color:${palette.accent};padding:0 10px;">♡</td>
                <td class="pulse-heart" style="font-family:Arial,sans-serif;font-size:29px;line-height:1;color:${palette.accent};">♥</td>
                <td class="float-heart" style="font-family:Arial,sans-serif;font-size:17px;color:${palette.accent};padding:0 10px;">♡</td>
              </tr></table>
            </td></tr>
            <tr><td align="center" style="font-size:27px;line-height:1.45;color:${palette.ink};">${greeting}</td></tr>
            <tr><td align="center" style="padding:20px 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="46" style="border-collapse:collapse;"><tr><td style="border-top:1px solid ${palette.accent};font-size:0;line-height:0;">&nbsp;</td></tr></table>
            </td></tr>
            <tr><td style="font-size:16px;line-height:1.95;color:${palette.ink};white-space:normal;">${safeMessage}</td></tr>
            <tr><td align="center" style="padding-top:34px;">
              <span style="display:inline-block;background:${palette.soft};border-radius:50px;padding:11px 21px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;color:${palette.accent};">คิดถึงนะ ♡</span>
            </td></tr>
            <tr><td align="center" style="padding-top:35px;font-size:17px;line-height:1.7;color:${palette.ink};">${safeSignature || "รักเสมอ ♡"}</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:24px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;color:${palette.accent};opacity:.8;">ส่งด้วยความรัก จาก dearly ♡</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
