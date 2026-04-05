# PHÂN CHIA NHIỆM VỤ DỰ ÁN (TASK ASSIGNMENT)

> **Mục tiêu**: Chia đều các chức năng nghiệp vụ theo spec hiện tại (B01-B26, có mở rộng B02.1/B02.2/B05.1).
> **Tiêu chí**: Mỗi người làm tối thiểu 4 chức năng, đảm bảo tính liên kết module.

## Bối cảnh repo `workshift-system` (cập nhật 2026-03)

| Thành phần | Vị trí | Ghi chú |
|------------|--------|---------|
| Frontend | `workshift-frontend/` | `VITE_API_BASE_URL` → backend đang chạy (`…/api/v1`). |
| Backend | `workshift-backend/` | Express + TypeScript + MongoDB. Hợp đồng REST: envelope JSON trong mã (`apiResponse` / `errorResponse`) và **README**; roadmap nghiệp vụ: **mục I–VII** trong file này. *(Bảng route mở rộng có thể giữ local trong `.cursor/rules/` — không bắt buộc trên Git.)* |
| Đặc tả | `docs/spec.md` | Nghiệp vụ B01–B26; mô hình dữ liệu tham chiếu. |

Roadmap phía dưới là **hạng mục nghiệp vụ theo nhóm**; triển khai backend bám **mục I** và hợp đồng API trong mã.  
*(Nếu có clone **Spring** local trong `workshift-backend-j/` — không trên Git — có thể đối chiếu khi port; dev thuần Node không bắt buộc.)*

---

## I. LỘ TRÌNH THEO GIAI ĐOẠN (ROADMAP CẬP NHẬT)

### Giai đoạn 0: Foundation & Security Baseline
- Mục tiêu: dựng khung backend Node + frontend, cấu hình MongoDB, JWT stateless.
- Kết quả mong đợi: hệ thống chạy được local, có profile test, có cấu trúc module rõ ràng.
- Trạng thái: **Đã triển khai**.

### Giai đoạn 1: Auth & Session
- Phạm vi: B01, B02, B02.1, B02.2.
- API chính: register, login, refresh, logout.
- Kết quả mong đợi: access token + refresh token hoạt động, refresh rotation, logout revoke refresh token.
- Trạng thái: **Đã triển khai**.

### Giai đoạn 2: Group Core & Membership
- Phạm vi: B03, B04, B05, B05.1.
- API chính: tạo group (có joinCode 6 ký tự), join-by-id/join-by-code, pending members, approve/reject member, audit timeline theo group.
- Kết quả mong đợi: hoàn chỉnh luồng tạo group và onboarding thành viên.
- Trạng thái: **Đã triển khai (Backend + UI cơ bản)**.

### Giai đoạn 3: Shift Configuration
- Phạm vi: B06, B07, B09, B10.
- Kết quả mong đợi: manager cấu hình vị trí, ca mẫu, ca làm việc, nhu cầu nhân sự.
- Trạng thái: **Đã triển khai (Backend), Frontend chưa triển khai**.

### Giai đoạn 4: Member Scheduling Flow
- Phạm vi: B08, B11, B12, B13, B19.
- Kết quả mong đợi: member khai báo lịch rảnh, xem ca phù hợp, đăng ký/hủy ca, xem lịch cá nhân.
- Trạng thái: **Chưa triển khai**.

### Giai đoạn 5: Manager & Advanced Operations
- Phạm vi: B14, B15, B16, B17, B18, B20, B21, B22, B24, B25, B26.
- Kết quả mong đợi: duyệt phân ca, gợi ý, khóa ca, đổi ca, payroll, báo cáo hoạt động.
- Trạng thái: **Chưa triển khai**.

### Giai đoạn 6: Hệ thống Admin (System Governance)
- Phạm vi: B23.
- Kết quả mong đợi: quản trị hệ thống tập trung (list user/group, khóa/mở user/group, dashboard chỉ số theo ngày/tháng, audit thao tác admin).
- Trạng thái: **Chưa triển khai**.

---

## II. DANH SÁCH NHIỆM VỤ THEO THÀNH VIÊN

### 👨‍💻 Thành viên 1: Auth & Group Core (Nền tảng & Quản trị)
*Người đi đầu (Pioneer) - Dựng khung dự án*

**Giai đoạn 0: Setup Core (Quan trọng)**
*   *Branch*: `feature/project-init` (hoặc `feature/auth-core`)
*   *Commits*:
    - `chore(init): init backend node and react project`
    - `feat(core): add base entity and database config`
    - `chore(security): basic security configuration`
    - `feat(user): add user entity and repository`
*   *Lưu ý*: Tạo `BaseEntity` và `User` entity trước để các thành viên khác sử dụng.

**Nhiệm vụ (Tasks) - 7 Features:**
1.  **[B01] Đăng ký tài khoản**: API đăng ký, hash password, validate email/username.
    *   *Branch*: `feature/auth-register`
    *   *Commits*: `feat(auth): add register endpoint`, `test(auth): add unit test for register`
    *   *Entity*: Cập nhật `User` (nếu cần).
2.  **[B02] Đăng nhập**: API login, sinh JWT token, cấu hình Security.
    *   *Branch*: `feature/auth-login`
    *   *Commits*: `feat(auth): implement login with jwt`, `chore(security): config security filter chain`
3.  **[B02.1 + B02.2] Session Flow**: API refresh token + logout revoke refresh token.
    *   *Branch*: `feature/auth-session`
    *   *Commits*: `feat(auth): add refresh token rotation`, `feat(auth): revoke refresh token on logout`
4.  **[B03] Tạo Group (Quán)**: API tạo group, auto-assign Manager, sinh joinCode.
    *   *Branch*: `feature/group-create`
    *   *Commits*: `feat(group): add create group api`, `feat(group): generate join code for group`
    *   *Entity*: Tạo `Group`, `GroupMember`.
5.  **[B04] Join Group**: API gửi request tham gia group theo ID hoặc theo mã.
    *   *Branch*: `feature/group-join`
    *   *Commits*: `feat(group): add join request api`, `feat(group): add join by code api`
6.  **[B05] Duyệt thành viên**: API xem pending và duyệt/từ chối request tham gia.
    *   *Branch*: `feature/group-approval`
    *   *Commits*: `feat(group): add pending member list api`, `feat(group): add member approval logic`
7.  **[B05.1] Group Operational Audit (Manager)**: API timeline hoạt động group theo ngày/tháng, filter theo actor/action/entity.
    *   *Branch*: `feature/group-audit-timeline`
    *   *Commits*: `feat(audit): add group audit log model and query apis`, `test(audit): add manager audit access tests`

**Quy trình Git (Workflow):**
1.  **Khởi tạo (Setup Core)**: Clone repo -> Tạo khung project -> Push `feature/project-init` -> Merge vào `develop`.
2.  **Làm việc (Features)**:
    - Từ `develop`, tạo các nhánh feature nhỏ (B01, B02...) để làm việc song song hoặc tuần tự.
    - Merge từng feature vào `develop` ngay khi xong.

---

### 👨‍💻 Thành viên 2: Shift Configuration (Cấu hình Ca làm việc)
*Người xây dựng dữ liệu nền (Builder)*

**Nhiệm vụ (Tasks) - 4 Features:**
1.  **[B06] Quản lý Vị trí**: CRUD Position (Pha chế, Thu ngân...).
    *   *Branch*: `feature/position-crud`
    *   *Commits*: `feat(position): add crud api`, `test(position): test create position`
    *   *Entity*: Tạo `Position`.
2.  **[B07] Cấu hình Ca Mẫu (Shift Template)**: CRUD Template giờ làm việc.
    *   *Branch*: `feature/shift-template`
    *   *Commits*: `feat(shift): add shift template entity`, `feat(shift): implement template crud`
    *   *Entity*: Tạo `ShiftTemplate`.
3.  **[B09] Tạo Ca làm việc**: API tạo ca (từ template hoặc thủ công), validate trùng giờ.
    *   *Branch*: `feature/shift-create`
    *   *Commits*: `feat(shift): add create shift api`, `fix(shift): validate overlapping time`
    *   *Entity*: Tạo `Shift`.
4.  **[B10] Cấu hình Nhu cầu**: API set số lượng nhân viên cần cho từng vị trí trong ca.
    *   *Branch*: `feature/shift-requirement`
    *   *Commits*: `feat(shift): add requirement configuration`
    *   *Entity*: Tạo `ShiftRequirement`.
*(Hỗ trợ)*: Viết Unit Test cho logic check trùng giờ ca.

**Quy trình Git (Workflow):**
1.  **Chờ đợi**: Đợi TV1 merge khung Auth.
2.  **Làm việc**:
    - `git pull origin develop` (Lấy khung Auth về).
    - Tạo nhánh `feature/shift-config`.
    - Tạo Entity `Position`, `ShiftTemplate`, `Shift`, `ShiftRequirement`.
    - **Lưu ý**: Nếu cần sửa `User` entity, hãy báo TV1 hoặc tạo nhánh phụ để tránh conflict.

---

### 👨‍💻 Thành viên 3: Member Operations (Thao tác Nhân viên)
*Người phát triển tính năng người dùng (Frontend-heavy)*

**Nhiệm vụ (Tasks) - 5 Features:**
1.  **[B08] Khai báo Lịch rảnh**: API lưu Availability theo tuần.
    *   *Branch*: `feature/member-availability`
    *   *Commits*: `feat(member): add availability api`, `style(member): format availability code`
    *   *Entity*: Tạo `Availability`.
2.  **[B11] Xem Ca phù hợp**: Logic filter ca `OPEN` + `Availability` + chưa full slot.
    *   *Branch*: `feature/member-view-shifts`
    *   *Commits*: `feat(shift): add filter for available shifts`
3.  **[B12] Đăng ký Ca**: API tạo Registration (`PENDING`), check validate cơ bản.
    *   *Branch*: `feature/member-registration`
    *   *Commits*: `feat(reg): implement register api`, `test(reg): test registration validation`
    *   *Entity*: Tạo `Registration`.
4.  **[B13] Hủy Đăng ký**: API hủy đăng ký (check rule thời gian).
    *   *Branch*: `feature/member-cancel-reg`
    *   *Commits*: `feat(reg): add cancel registration logic`
5.  **[B19] Xem Lịch cá nhân**: API lấy danh sách ca đã `APPROVED` của user.
    *   *Branch*: `feature/member-schedule`
    *   *Commits*: `feat(member): add my schedule api`

**Quy trình Git (Workflow):**
1.  **Làm việc**:
    - Có thể làm giao diện (Frontend) trước trên nhánh `feature/member-ui`.
    - Khi Backend của TV2 xong (API Shift), pull về để tích hợp.
    - Nhánh backend: `feature/member-api` (Availability, Registration).

---

### 👨‍💻 Thành viên 4: Manager Operations (Thao tác Quản lý & Cấu hình Lương)
*Người phát triển tính năng quản lý (Logic-heavy)*

**Nhiệm vụ (Tasks) - 6 Features:**
1.  **[B14] Duyệt Ca**: API approve registration, check quota `ShiftRequirement`.
    *   *Branch*: `feature/manager-approve-reg`
    *   *Commits*: `feat(manager): add approve logic`, `fix(manager): check quota before approve`
2.  **[B15] Từ chối Ca**: API reject registration.
    *   *Branch*: `feature/manager-reject-reg`
    *   *Commits*: `feat(manager): add reject api`
3.  **[B16] Gán nhân viên (Manual Assign)**: API force add member vào ca (bypass flow đăng ký).
    *   *Branch*: `feature/manager-assign`
    *   *Commits*: `feat(manager): implement manual assign`
4.  **[B17] Cảnh báo Thiếu người**: Logic/API check các ca sắp diễn ra mà chưa đủ người (`APPROVED < Required`).
    *   *Branch*: `feature/manager-alert`
    *   *Commits*: `feat(manager): add understaffed alert logic`
5.  **[B24] Cấu hình Lương**: API set lương theo vị trí hoặc nhân viên.
    *   *Branch*: `feature/salary-config`
    *   *Commits*: `feat(salary): add salary config api`
    *   *Entity*: Tạo `SalaryConfig`.
6.  **[B25] Xem Bảng lương (Payroll)**: API thống kê tổng giờ làm * lương.
    *   *Branch*: `feature/payroll-report`
    *   *Commits*: `feat(report): implement payroll calculation`

**Quy trình Git (Workflow):**
1.  **Làm việc**:
    - Nhánh `feature/manager-approval`.
    - Cần data từ TV3 (Registration) để test duyệt đơn.
    - Trong lúc chờ TV3, có thể viết Unit Test hoặc Mock Data.

---

### 👨‍💻 Thành viên 5: Advanced Features + Admin System (Tính năng Nâng cao & Quản trị hệ thống)
*Người giải quyết bài toán khó (Algorithm) & Thống kê*

**Nhiệm vụ (Tasks) - 6 Features:**
1.  **[B18] Gợi ý Nhân viên**: Thuật toán tìm nhân viên phù hợp (Rảnh + Đúng vị trí + Chưa có lịch).
    *   *Branch*: `feature/algo-recommendation`
    *   *Commits*: `feat(algo): implement recommendation algorithm`, `test(algo): test recommendation logic`
2.  **[B20] Khóa Ca (Lock)**: Scheduler/API chuyển trạng thái ca sang `LOCKED`.
    *   *Branch*: `feature/shift-lock`
    *   *Commits*: `feat(scheduler): add auto lock shift job`
3.  **[B21] Yêu cầu Đổi ca**: API tạo request đổi ca, validate logic đổi.
    *   *Branch*: `feature/shift-change-request`
    *   *Commits*: `feat(change): add change request api`
    *   *Entity*: Tạo `ShiftChangeRequest`.
4.  **[B22] Duyệt Đổi ca**: API xử lý đổi ca (Hủy cũ + Đăng ký mới trong 1 transaction).
    *   *Branch*: `feature/shift-change-approval`
    *   *Commits*: `feat(change): implement approval transaction`, `fix(change): rollback on failure`
5.  **[B26] Báo cáo Hoạt động (Performance Report)**: API thống kê số ca, tổng giờ làm theo tuần/tháng (so sánh hiệu suất).
    *   *Branch*: `feature/activity-report`
    *   *Commits*: `feat(report): add activity statistics api`
6.  **[B23] Quản lý Hệ thống (Admin)**: API quản trị user/group (list, khóa/mở), chỉ ADMIN truy cập.
    *   *Branch*: `feature/admin-governance`
    *   *Commits*: `feat(admin): add system governance apis`, `feat(admin): add daily monthly metrics`, `test(admin): add admin authorization tests`

**Chi tiết triển khai B23 (theo phase nhỏ)**
1.  **Admin Identity & Access**
    *   `feature/admin-authz`
    *   Guard `global_role=ADMIN` cho toàn bộ admin endpoints.
2.  **Admin User Governance**
    *   `feature/admin-users`
    *   API list/filter/paginate users; khóa/mở user.
3.  **Admin Group Governance**
    *   `feature/admin-groups`
    *   API list/filter/paginate groups; khóa/mở group.
4.  **Admin Daily Metrics**
    *   `feature/admin-metrics-daily`
    *   Chỉ số vận hành theo ngày: active users, failed logins, số user/group bị khóa, số cảnh báo.
5.  **Admin Monthly Metrics**
    *   `feature/admin-metrics-monthly`
    *   Chỉ số vận hành theo tháng: tăng trưởng user/group, tỷ lệ khóa tài khoản, xu hướng lỗi.
6.  **Admin Audit Trail**
    *   `feature/admin-audit-log`
    *   Ghi và truy vấn audit log cho mọi thao tác admin.

**Quy trình Git (Workflow):**
1.  **Làm việc**:
    - Nhánh `feature/advanced-algo`.
    - Tính năng Gợi ý nhân viên (Recommendation) không phụ thuộc nhiều vào UI, có thể viết Service/Algorithm độc lập.
    - Khi TV3 xong data `Availability`, tích hợp vào thuật toán.

---

## III. BẢNG TRIỂN KHAI CHI TIẾT CHO ADMIN & GROUP AUDIT

| Hạng mục | API/Output chính | Branch đề xuất | Điều kiện hoàn thành (DoD) |
| :--- | :--- | :--- | :--- |
| Admin Access Control | Guard `global_role=ADMIN` cho `/api/v1/admin/**` | `feature/admin-authz` | User thường bị 403; Admin truy cập được |
| User Governance | `GET /api/v1/admin/users`, `PATCH /users/{id}/status` | `feature/admin-users` | Lọc/phân trang đúng; khóa/mở user đúng trạng thái |
| Group Governance | `GET /api/v1/admin/groups`, `PATCH /groups/{id}/status` | `feature/admin-groups` | Lọc/phân trang đúng; khóa/mở group đúng trạng thái |
| Admin Metrics Daily | `GET /api/v1/admin/metrics/daily` | `feature/admin-metrics-daily` | Trả số liệu theo ngày đúng timezone chuẩn |
| Admin Metrics Monthly | `GET /api/v1/admin/metrics/monthly` | `feature/admin-metrics-monthly` | Trả tổng hợp tháng đúng số liệu đối soát |
| Admin Audit Trail | `GET /api/v1/admin/audit-logs` | `feature/admin-audit-log` | Có actor/action/target/time và filter theo range |
| Group Audit Foundation | Bảng `group_audit_logs`, service ghi log | `feature/group-audit-foundation` | Ghi log cho B03-B05 với before/after phù hợp |
| Group Audit Query | `GET /api/v1/groups/{id}/audit-logs` | `feature/group-audit-query` | Manager xem được log group của mình, có filter + pagination |
| Group Daily Summary | `GET /api/v1/groups/{id}/audit-logs/summary/daily` | `feature/group-audit-daily` | Trả số sự kiện/ngày theo action type |
| Group Monthly Summary | `GET /api/v1/groups/{id}/audit-logs/summary/monthly` | `feature/group-audit-monthly` | Trả xu hướng tháng phục vụ dashboard manager |

---

## IV. QUY TRÌNH LÀM VIỆC VỚI GIT (GIT WORKFLOW)

Để đảm bảo code chất lượng và tránh xung đột khi 5 người cùng làm việc, chúng ta tuân thủ quy trình sau:

### 1. Các lệnh Git cơ bản & Ngữ cảnh sử dụng
| Lệnh | Ngữ cảnh sử dụng |
| :--- | :--- |
| `git clone <url>` | **Bắt đầu**: Tải dự án về máy lần đầu tiên. |
| `git pull origin <branch>` | **Cập nhật**: Lấy code mới nhất từ server về trước khi bắt đầu làm việc. |
| `git checkout -b <branch>` | **Tạo nhánh**: Bắt đầu một tính năng mới hoặc fix bug. |
| `git add .` | **Chọn file**: Đưa các file đã sửa vào danh sách chuẩn bị commit. |
| `git commit -m "msg"` | **Lưu**: Lưu lại các thay đổi vào lịch sử (local). |
| `git push origin <branch>` | **Đẩy code**: Đưa code từ máy lên server (GitHub/GitLab). |
| `git merge <branch>` | **Gộp code**: Đưa code từ nhánh con vào nhánh chính (thường làm qua Pull Request). |
| `git stash` | **Tạm lưu**: Cất tạm code đang làm dở để chuyển sang việc khác gấp. |
| `git stash pop` | **Lấy lại**: Lấy lại code đã stash để làm tiếp. |
| `git rebase <branch>` | **Làm gọn**: Cập nhật nhánh con theo nhánh chính mới nhất (dùng cẩn thận). |
| `git cherry-pick <hash>` | **Nhặt code**: Lấy 1 commit cụ thể từ nhánh khác sang nhánh mình. |
| `git revert <hash>` | **Hoàn tác**: Tạo commit mới để đảo ngược lại commit bị lỗi (An toàn hơn reset). |

### 2. Mô hình Branching (Git Flow Simplified)
Chúng ta sử dụng mô hình đơn giản hóa của Git Flow:

*   **`main` (hoặc `master`)**: Nhánh sản phẩm, code luôn chạy ổn định. Chỉ merge vào khi Release.
*   **`develop`**: Nhánh phát triển chính. Code của mọi người sẽ merge vào đây.
*   **`feature/<tên-tính-năng>`**: Nhánh con tách từ `develop` để làm từng chức năng.
    *   VD: `feature/auth-login`, `feature/shift-crud`.
*   **`hotfix/<tên-lỗi>`**: Nhánh sửa lỗi gấp trên production.

### 3. Quy trình thực hiện Code (Step-by-Step)
1.  **Cập nhật**: `git checkout develop` -> `git pull origin develop`.
2.  **Tạo nhánh**: `git checkout -b feature/B01-register-api`.
3.  **Code & Test**: Viết code, chạy thử ở local.
4.  **Commit**: `git add .` -> `git commit -m "feat(auth): implement register api"`.
5.  **Push**: `git push origin feature/B01-register-api`.
6.  **Pull Request (PR)**: Tạo PR trên GitHub/GitLab từ nhánh của mình vào `develop`.
7.  **Review**: Mời ít nhất 1 thành viên khác review code.
8.  **Merge**: Sau khi được approve và pass CI, merge PR vào `develop`.

### 4. Chuẩn Commit Message
Sử dụng format: `<type>(<scope>): <description>`

*   **`feat`**: Tính năng mới (VD: `feat(auth): add login endpoint`)
*   **`fix`**: Sửa lỗi (VD: `fix(shift): correct date validation`)
*   **`docs`**: Tài liệu (VD: `docs: update readme`)
*   **`style`**: Format code, không đổi logic (VD: `style: format code`)
*   **`refactor`**: Sửa code nhưng không đổi tính năng (VD: `refactor(service): optimize query`)
*   **`test`**: Thêm test (VD: `test(auth): add unit test for login`)
*   **`chore`**: Việc vặt (VD: `chore: update dependencies`)

### 5. Checklist Pre-commit & Pre-push
Trước khi push code, hãy tự kiểm tra:
- [ ] Code đã được format (VSCode / IDE tương đương).
- [ ] Không còn biến thừa, log thừa (`System.out.println`, `console.log`).
- [ ] Đã chạy thử ứng dụng và không bị crash.
- [ ] Đã chạy Unit Test liên quan (nếu có).

### 6. Xử lý Conflict & Review
*   **Conflict**: Nếu file bị xung đột, Git sẽ báo. Bạn cần mở file đó lên, chọn giữ code nào (Current Change hay Incoming Change), sau đó commit lại.
*   **Review**: Người review cần check logic, đặt tên biến, và bảo mật. Không merge nếu code chưa đạt chuẩn.

### 7. Rollback & Revert
*   Nếu lỡ merge code lỗi vào `develop`: Dùng `git revert <commit-hash-của-lần-merge>` để tạo một commit mới đảo ngược lại thay đổi đó. **Tuyệt đối không dùng `git reset --hard` trên nhánh chung `develop`**.

---

## V. DANH SÁCH TÍNH NĂNG & TIẾN ĐỘ (PRIORITY MATRIX)

| Priority | Feature | Owner | Est. Time | Acceptance Criteria (AC) |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Gấp)** | **B01, B02, B02.1, B02.2 (Auth)** | TV1 | 4 ngày | Login/Register/Refresh/Logout hoạt động ổn định. |
| **P0 (Gấp)** | **B03, B04, B05 (Group)** | TV1 | 3 ngày | Tạo group có joinCode, join và duyệt thành viên hoàn chỉnh. |
| **P1 (Cao)** | **B06, B07 (Config)** | TV2 | 3 ngày | Tạo được Vị trí, Ca mẫu. |
| **P1 (Cao)** | **B08 (Avail)** | TV3 | 2 ngày | Member lưu được lịch rảnh. |
| **P1 (Cao)** | **B09 (Shift)** | TV2 | 3 ngày | Manager tạo được lịch làm việc từ template. |
| **P2 (TB)** | **B11, B12 (Reg)** | TV3 | 3 ngày | Member thấy và đăng ký được ca. |
| **P2 (TB)** | **B14, B15 (Approve)**| TV4 | 2 ngày | Manager duyệt được đơn. |
| **P2 (TB)** | **B23 (Admin System)**| TV5 | 2 ngày | Admin quản trị được user/group, quyền truy cập chuẩn. |
| **P2 (TB)** | **B23.1 (Admin Metrics Daily/Monthly)**| TV5 | 2 ngày | Dashboard admin có đủ số liệu ngày/tháng để giám sát ổn định hệ thống. |
| **P1 (Cao)** | **B05.1 (Group Audit Timeline)**| TV1 | 2 ngày | Manager truy vấn được timeline hoạt động group theo actor/action/date. |
| **P3 (Thấp)**| **B18, B21 (Advanced)**| TV5 | 5 ngày | Gợi ý nhân viên chạy đúng; Đổi ca hoạt động ổn. |

---

## VI. QUY TRÌNH PHÁT TRIỂN & DEPLOYMENT (CI/CD)

### 0. Bổ sung cho backend Node (`workshift-backend`)

- Build: `npm run build` (ra thư mục `dist/`).
- Chạy production: `npm start` (cần biến môi trường trên server giống local; **không** lưu secret trong repo).
- Deploy có thể dùng `node dist/index.js` hoặc PM2/systemd; database **MongoDB**.

### 1. Môi trường (Environments)
*   **Local**: Môi trường phát triển trên máy cá nhân của từng thành viên.
*   **Staging (Develop)**: Môi trường kiểm thử tích hợp, code được deploy tự động từ nhánh `develop`.
*   **Production**: Môi trường chạy thật, code được deploy từ nhánh `main` sau khi release.

### 2. Quy trình Release (Git Flow Release)
1.  Từ nhánh `develop` (đã test ổn định), tạo nhánh `release/v1.0.0`.
2.  Bump version trong `workshift-backend/package.json` và `workshift-frontend/package.json`.
3.  Test lần cuối trên nhánh release.
4.  Merge `release/v1.0.0` vào `main` và `develop`.
5.  Tag version trên `main`: `git tag -a v1.0.0 -m "Release version 1.0.0"`.
6.  Deploy `main` lên Production.

### 3. Quy trình Deploy
*   **Backend** (`workshift-backend`): `npm ci && npm run build`, triển khai `dist/` + `node_modules`, cấu hình env, khởi động process (PM2/systemd/container).
*   **Frontend**: `npm run build` → tải tệp tĩnh lên hosting (Nginx/S3/Vercel).
*   **Database**: quản lý index/schema MongoDB phù hợp release.

### 4. Rollback Plan (Kế hoạch dự phòng)
*   **Code lỗi**: Revert commit merge trên `main`, build và deploy lại version cũ.
*   **DB lỗi**: Restore backup database gần nhất trước khi deploy.
*   **Config lỗi**: Rollback file cấu hình env.

---

## VII. CÔNG CỤ HỖ TRỢ (TOOLS)
*   **IDE**: VS Code hoặc tương đương (full-stack).
*   **API Test**: Postman / Thunder Client / HTTP file.
*   **Database**: MongoDB Compass, `mongosh`, hoặc GUI tương thích MongoDB.
*   **Communication**: Slack / Discord / Zalo.
*   **Task Management**: Jira / Trello / GitHub Projects.
