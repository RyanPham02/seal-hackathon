# Frontend Requirements

> Ghi chu: Cac muc thieu mo ta hoac primary actor duoc danh dau la `TBD` de tiep tuc bo sung.

## 1. Authentication & User Profile

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-AUTH-01 | Register a new account with email and password | Guest |
| FE-AUTH-02 | Login and logout of the system | User, Admin |
| FE-AUTH-03 | Reset password and email | Guest, User |
| FE-AUTH-04 | View and update personal profile, account setting, and notification preferences | User, Admin |

## 2. Dashboard & General

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-DASH-01 | Dashboard Overview: trang tong quan chinh cua he thong khi user login vao se o trang nay | User, Admin, Judge, Mentor |
| FE-DASH-02 | TBD | User |
| FE-DASH-03 | Notifications: thong bao rieng cho tung user | User, Judge, Mentor, Admin |
| FE-DASH-04 | System Notifications: thong bao cho toan bo he thong | Admin |
| FE-DASH-05 | Theme & Language: cho phep user thay doi giao dien va ngon ngu | User |

## 3. Document Management

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-DOC-01 | Upload the document on the system | User |
| FE-DOC-02 | Search/List Documents: hien thi danh sach document va cho search/filter | User, Judge, Admin |
| FE-DOC-03 | View document detail: xem chi tiet tai lieu | User, Judge, Admin |
| FE-DOC-04 | Edit document: cho phep chinh sua metadata cua du lieu | User, Admin |
| FE-DOC-05 | Delete document | User, Admin |
| FE-DOC-06 | Download the document | User, Judge, Mentor |
| FE-DOC-07 | Share the document | User, Admin |

## 4. Cloud Storage

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-CLD-01 | Upload to cloud | System, User |
| FE-CLD-02 | Upload progress: hien thi tien trinh tai tep len he thong | User |
| FE-CLD-03 | Preview document: xem truoc tai lieu truoc khi gui va luu | User, Judge, Mentor |

## 5. Event Management

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-EVT-01 | Create event | Admin |
| FE-EVT-02 | Manage event: quan ly, cap nhat thong tin su kien | TBD |
| FE-EVT-03 | Create rounds | TBD |
| FE-EVT-04 | Configure rounds: thiet lap cau hinh cho vong thi | TBD |
| FE-EVT-05 | Promotion rules: thiet lap nguyen tac thang cho cac doi thi | TBD |
| FE-EVT-06 | Judge Assignment: phan cong giam khao | TBD |
| FE-EVT-07 | Deadlines configuration: thiet lap thoi gian nop va cham diem | TBD |

## 6. Track / Category Management

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-TRC-01 | Create track: tao hang muc thi dau | Admin |
| FE-TRC-02 | Assign mentors: phan cong mentor cho hang muc | TBD |
| FE-TRC-03 | Manage categories: quan ly, cap nhat cac hang muc | TBD |

## 7. Team Management

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-TEA-01 | Create team | Team Management |
| FE-TEA-02 | Invite members | TBD |
| FE-TEA-03 | Register track: dang ky doi vao hang muc thi dau | TBD |
| FE-TEA-04 | Manage team info: quan ly, cap nhat thong tin doi thi | TBD |
| FE-TEA-05 | Kick Member | Leader |
| FE-TEA-06 | Out team | Member |
| FE-TEA-07 | Preview and support team | Mentor |

## 8. Submission Management

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-SUB-01 | Submit a project repository link for evaluation. Team nop link GitHub/GitLab project. | Team Leader |
| FE-SUB-02 | Submit a demo link for the project. Team nop link demo san pham. | TBD |
| FE-SUB-03 | Submit a report or presentation file link. Nop report, slide, document. | TBD |
| FE-SUB-04 | Update submission information before the deadline. Cho phep team sua submission truoc deadline. | TBD |
| FE-SUB-05 | View previous submission records and details. Cho phep xem lich su submission cu. | Team Leader, Judge |

## 9. Judging & Scoring

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-JSRC-01 | Score submissions based on defined criteria. Judge cham diem theo tung tieu chi. | Judge |
| FE-JSRC-02 | Calculate scores using assigned criterion weights. | System |
| FE-JSRC-03 | Allow judges to add comments to submissions. Judge viet feedback cho team. | Judge |
| FE-JSRC-04 | Finalize and lock submitted scores. Sau khi judge cham xong khoa diem lai. | Judge |
| FE-JSRC-05 | Generate rankings based on team scores. Tao bang xep hang. | System, Admin |
| FE-JSRC-06 | Eliminate teams that violate rules or requirements. Admin loai team gian lan. | Admin |
| FE-JSRC-07 | Record system actions for tracking purposes. Luu lich su hanh dong he thong. | System |

## 10. Research / Analytics

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-RSA-01 | Analyze consistency among judges' scores using ICC. Kiem tra cac judge co cham giong nhau khong. | Admin |
| FE-RSA-02 | Export anonymized scoring data as CSV files. Xuat file CSV chua du lieu cham diem an ten judge. | Judge, Admin |

## 11. Prize & Announcement

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-PRAN-01 | Award Management: giai thuong cua cuoc thi | Admin |
| FE-PRAN-02 | Publish Results: ket qua chinh thuc cua cuoc thi | Admin |
| FE-PRAN-03 | Export ranking: bang xep hang cuoc thi | Admin |
| FE-PRAN-04 | Notification: thong bao ket qua den cho user | Admin, System |

## 12. AI Chatbot

| Feature Code | Feature Description | Primary Actor |
| --- | --- | --- |
| FE-AI-01 | Ho tro user dang ky | System |
| FE-AI-02 | The le cuoc thi | System |
| FE-AI-03 | Co cau giai thuong | System |
| FE-AI-04 | Tim nhom, kiem mentor | System |
