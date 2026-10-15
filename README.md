# dearly.

แอป Next.js สำหรับเขียนอีเมลบอกรัก ปรับธีมและดูตัวอย่างทันที ส่งจดหมายทันทีผ่าน Gmail หรือเลือกตั้งเวลาส่งผ่าน Resend

## เริ่มต้นใช้งาน

ต้องใช้ Node.js 20.9 ขึ้นไป

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## ตั้งค่าการส่งอีเมล

### Gmail สำหรับส่งทันที

1. ใน Google Cloud Console ให้เปิดใช้ **Gmail API** และตั้งค่า OAuth consent screen พร้อมเพิ่มบัญชีผู้ทดสอบเมื่อแอปยังอยู่ในโหมดทดสอบ
2. สร้าง OAuth client ID ชนิด **Web application** และเพิ่ม Authorized redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
3. คัดลอก `.env.example` เป็น `.env.local` แล้วกำหนด Google OAuth ID/secret และสร้าง secret ของ NextAuth:

   ```dotenv
   GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate-a-long-random-secret
   ```

   ตั้งค่า secret แบบสุ่มที่ยาวด้วย `openssl rand -base64 32` หรือใช้ตัวสร้าง secret ที่เชื่อถือได้

ผู้ใช้ต้องเชื่อมต่อบัญชี Google ในหน้า Dearly ก่อนส่งทันที จดหมายจะส่งจาก Gmail ของบัญชีนั้นโดยใช้สิทธิ์ `gmail.send` เท่านั้น เก็บ OAuth client secret และ `NEXTAUTH_SECRET` ไว้ใน environment variables ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใช้ชื่อตัวแปรขึ้นต้นด้วย `NEXT_PUBLIC_`

### Resend สำหรับตั้งเวลาส่ง

สร้าง API key ใน [Resend](https://resend.com/api-keys) และยืนยันโดเมนผู้ส่ง จากนั้นเพิ่มค่าต่อไปนี้ใน `.env.local`:

```dotenv
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Dearly <hello@your-verified-domain.com>
```

การตั้งเวลาจะส่ง `scheduled_at` ให้ Resend โดยตรง (Resend รองรับล่วงหน้าไม่เกิน 30 วัน) เวลาที่เลือกในหน้าเว็บใช้เขตเวลาของอุปกรณ์ และแปลงเป็น UTC ก่อนส่ง ผู้ให้บริการเป็นผู้จัดการคิวอีเมลตามเวลาที่กำหนด

## Deploy บน Vercel

1. Push โปรเจกต์ไปยัง Git repository แล้ว Import โปรเจกต์ใน Vercel โดยเลือก framework เป็น Next.js
2. เพิ่มตัวแปร Google OAuth, `NEXTAUTH_URL` (โดเมน production) และ `NEXTAUTH_SECRET` ใน **Project Settings → Environment Variables** และเพิ่ม production callback URI ใน Google Cloud Console
3. เพิ่ม `RESEND_API_KEY` และ `RESEND_FROM_EMAIL` เพื่อเปิดใช้การตั้งเวลาส่ง
4. Deploy หรือ redeploy โปรเจกต์

โปรเจกต์นี้ไม่มีฐานข้อมูล ไม่เก็บเนื้อหาอีเมลหรือรายการนัดส่งไว้เอง งานที่ตั้งเวลาจะอยู่ในระบบของ Resend

## ความเป็นส่วนตัว

แอปตัวอย่างนี้ยังไม่มีบัญชีผู้ใช้หรือการจำกัดจำนวนครั้งส่ง จึงควรใช้กับ deployment ส่วนตัว หรือเปิด **Vercel Deployment Protection** ก่อนนำไปใช้จริงในวงกว้าง เพื่อป้องกันการใช้งาน API ส่งอีเมลโดยไม่ได้รับอนุญาต
