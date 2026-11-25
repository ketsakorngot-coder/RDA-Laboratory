RDA V6.9.4 — FIXED TEACHER PIN PACKAGE

Teacher PIN: 25692569

ติดตั้ง:
1. เปิด Apps Script ที่ผูกกับ Google Sheet เดิม
2. แทนที่ Code.gs ด้วย Code.gs ในชุดนี้ทั้งไฟล์
3. แทนที่ TeacherDashboard.html ด้วยไฟล์ในชุดนี้ทั้งไฟล์
4. กด Save
5. เลือกฟังก์ชัน setupV694 แล้วกด Run 1 ครั้ง
6. Deploy > Manage deployments > Edit > New version > Deploy
7. เปิด URL /exec?view=teacher
8. ใช้ Teacher PIN: 25692569

สำคัญ:
- ต้องรัน setupV694 อย่างน้อย 1 ครั้ง เพื่อบันทึก PIN ลง Script Properties
- หลังแก้ source ต้อง Deploy เป็น New version เพื่อให้หน้า Web App ใช้โค้ดล่าสุด
