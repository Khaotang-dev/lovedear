import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dearly — ส่งความรู้สึกให้ถึงใจ",
  description:
    "เขียนจดหมายบอกรัก ปรับแต่งดีไซน์ และส่งให้คนพิเศษในเวลาที่ใช่",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
