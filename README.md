# dearly.

แอป Next.js สำหรับเขียนอีเมลบอกรัก ปรับธีมและดูตัวอย่างทันที ส่งจดหมายผ่าน Gmail หรือบันทึกร่างเพื่อไปตั้งเวลาส่งใน Gmail

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

ผู้ใช้ต้องเชื่อมต่อบัญชี Google ในหน้า Dearly ก่อนส่งหรือบันทึกร่าง จดหมายจะส่งหรือสร้างร่างใน Gmail ของบัญชีนั้น โดยใช้สิทธิ์ `gmail.send` และ `gmail.compose` ตามการทำงานที่เลือก เก็บ OAuth client secret และ `NEXTAUTH_SECRET` ไว้ใน environment variables ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใช้ชื่อตัวแปรขึ้นต้นด้วย `NEXT_PUBLIC_`

หากเคยเชื่อมต่อ Google ก่อนเพิ่มสิทธิ์ `gmail.compose` ให้ออกจากระบบแล้วเชื่อมต่อ Google ใหม่ เพื่ออนุญาตสิทธิ์สำหรับการบันทึกร่าง

### ตั้งเวลาส่งผ่าน Gmail

Gmail API ไม่มีคำสั่งตั้งเวลาส่งโดยตรง โหมด **บันทึกร่างเพื่อตั้งเวลาส่ง** จะสร้างร่างใน Gmail ให้ก่อน จากนั้นเปิด Gmail Drafts เลือกร่าง กดลูกศรข้างปุ่มส่ง และเลือก **ตั้งเวลาส่ง** แล้วเลือกวันและเวลาที่ต้องการใน Gmail

## Deploy บน Vercel

1. Push โปรเจกต์ไปยัง Git repository แล้ว Import โปรเจกต์ใน Vercel โดยเลือก framework เป็น Next.js
2. เพิ่มตัวแปร Google OAuth, `NEXTAUTH_URL` (โดเมน production) และ `NEXTAUTH_SECRET` ใน **Project Settings → Environment Variables** และเพิ่ม production callback URI ใน Google Cloud Console
3. Deploy หรือ redeploy โปรเจกต์

โปรเจกต์นี้ไม่มีฐานข้อมูล รายการร่างและการตั้งเวลาส่งที่ทำผ่าน Gmail จะถูกจัดการในบัญชี Gmail ของผู้ใช้

## ความเป็นส่วนตัว

แอปตัวอย่างนี้ยังไม่มีบัญชีผู้ใช้หรือการจำกัดจำนวนครั้งส่ง จึงควรใช้กับ deployment ส่วนตัว หรือเปิด **Vercel Deployment Protection** ก่อนนำไปใช้จริงในวงกว้าง เพื่อป้องกันการใช้งาน API ส่งอีเมลโดยไม่ได้รับอนุญาต
