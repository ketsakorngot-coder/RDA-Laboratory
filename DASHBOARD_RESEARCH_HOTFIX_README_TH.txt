RDA Teacher Dashboard — Research Interpretation Hotfix

แก้เฉพาะ google_apps_script_backend/Code.gs และ TeacherDashboard.html

Objective 3:
- ใช้ InitialScore R01–R06 เป็นคะแนนหลักสำหรับศึกษาพัฒนาการตามลำดับภารกิจ
- ไม่ใช้ RevisedScore แทนความสามารถอิสระ
- เพิ่ม Revision Gain = RevisedScore - InitialScore เป็น Learning Analytics แยกต่างหาก
- เลิกเรียก R01 = Before และ R06 = After
- R01 vs R06 แสดงเป็น descriptive development เท่านั้น ไม่ระบุว่าเป็น Pre/Post และไม่แนะนำ paired t-test จากบล็อกนี้
- Confidence calibration อิง Initial Decision Quality เพื่อไม่ปนผล feedback

ไม่ได้แก้:
- Student frontend
- Mission scoring engine / rubric
- unlock logic
- Google Sheets sync/write path
- Satisfaction
- Achievement PRE/POST

การอัปเดต Apps Script:
1. สำรอง Code.gs และ TeacherDashboard.html ปัจจุบัน
2. แทนด้วยสองไฟล์ใน google_apps_script_backend/
3. Save
4. Deploy > Manage deployments > Edit > New version > Deploy
5. ไม่ต้องรัน setupV694() ใหม่ หากชีต/ระบบเดิมทำงานอยู่แล้ว
