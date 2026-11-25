# V6.9.4 SECURITY / DEPLOYMENT NOTE

After copying `Code.gs` and `TeacherDashboard.html`, run `setupRDA()` and then `setTeacherPin("YOUR-STRONG-PIN")` (8+ characters), then deploy a new Web App version. Student sync now requires a session token issued by register/login and only dequeues after a matching server ACK.

# RDA Classroom Backend — Setup แบบสั้น

## สิ่งที่ได้
Student System → Google Apps Script API → Google Sheets ← Teacher System  
และ Student System ยังบันทึก localStorage เป็น Offline Backup

## ขั้นตอนติดตั้ง
1. สร้าง Google Sheet ใหม่ 1 ไฟล์ เช่น `RDA Classroom 2569`
2. ใน Google Sheet เลือก **Extensions → Apps Script**
3. ลบโค้ดเดิมใน `Code.gs` แล้วคัดลอกไฟล์ `Code.gs` จากโฟลเดอร์นี้ไปวาง
4. กด **+ → HTML** ตั้งชื่อ `TeacherDashboard` แล้วคัดลอก `TeacherDashboard.html` ไปวาง
5. กด Run ฟังก์ชัน `setupRDA()` หนึ่งครั้ง และอนุญาตสิทธิ์
6. ถ้าต้องการเปลี่ยน PIN ให้ Run `setTeacherPin('รหัสใหม่')` จาก Editor
7. เลือก **Deploy → New deployment → Web app**
   - Execute as: Me
   - Who has access: Anyone
8. Copy URL ที่ลงท้ายด้วย `/exec`
9. เปิดไฟล์ `classroom-config.js` ในเว็บ RDA แล้วแทน:
   `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE`
   ด้วย URL `/exec` ที่ได้
10. นำโฟลเดอร์ RDA ขึ้น Host / ChatGPT Site

## Teacher System
เปิดปุ่ม `TEACHER CENTER` ใน RDA เมื่อใส่ Web App URL แล้ว ระบบจะเปิด:
`YOUR_WEB_APP_URL?view=teacher`
Teacher ใส่ PIN ในหน้านี้ แล้วจะเห็นข้อมูลรวมทั้งห้อง

## Offline
ถ้าอินเทอร์เน็ตขาด:
- ข้อมูลยังอยู่ใน localStorage
- ปุ่มมุมขวาบนแสดง `OFFLINE / SYNC PENDING`
- เมื่อออนไลน์ ระบบพยายามส่ง Queue อีกครั้งอัตโนมัติ

## Google Sheet tabs
- STUDENTS
- ASSESSMENTS
- CASES
- EVENTS

## หมายเหตุด้านความปลอดภัย
Teacher PIN ถูกตรวจใน Apps Script backend ไม่ได้ใช้ PIN จาก Student website เพื่ออ่านข้อมูลทั้งห้อง
