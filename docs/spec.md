# BẢNG ĐẶC TẢ HOÀN CHỈNH (SPECIFICATION)

> **Hệ thống quản lý đăng ký & phân ca lao động thời vụ (Multi-group Workshift Management)**
>
> Phiên bản: 1.7 (Cập nhật tiến trình triển khai B05.1 + B06-B10)
> Ngày cập nhật: 2026-03-24

**Ghi chú triển khai (repo `workshift-system`):**

- **Frontend** (`workshift-frontend`): React 19 + Vite 7; API qua `fetch` (`apiClient.js`).
- **Backend** (`workshift-backend`): Express + TypeScript + MongoDB (Mongoose); **JSON API** khớp frontend, envelope thống nhất trong mã backend và mô tả trong **README**. Lộ trình triển khai nghiệp vụ: **`docs/tasks.md`** (roadmap theo giai đoạn).
- Phần **schema thực thể** dưới đây là *mô hình dữ liệu logic* (bảng quan hệ). Trên MongoDB có thể tách/ghép collection khác miễn **API và nghiệp vụ** không đổi.

---

## I. BẢNG NGHIỆP VỤ (BUSINESS REQUIREMENTS)

| ID | Nghiệp vụ | Role | Mô tả chi tiết (Business Logic) | Input/Output |
| :--- | :--- | :--- | :--- | :--- |
| **B01** | **Đăng ký tài khoản** | User | Tạo tài khoản mới. Email & Username phải duy nhất. Password phải được hash. | Input: Email, User, Pass<br>Output: User Info |
| **B02** | **Đăng nhập** | User | Xác thực user. Trả về access token + refresh token kèm thông tin user cơ bản. | Input: Email/User, Pass<br>Output: Access Token, Refresh Token |
| **B02.1** | **Làm mới Access Token** | User | Dùng refresh token hợp lệ để lấy access token mới và refresh token mới (rotation). Refresh token cũ bị revoke. | Input: Refresh Token<br>Output: Access Token mới, Refresh Token mới |
| **B02.2** | **Đăng xuất** | User | User đã đăng nhập thực hiện logout. Hệ thống revoke toàn bộ refresh token còn hiệu lực của user. | Input: Bearer Access Token<br>Output: Logout Result |
| **B03** | **Tạo Group (Quán)** | Manager | User tạo group mới. Người tạo tự động trở thành MANAGER của group đó và hệ thống sinh `joinCode` 6 ký tự. | Input: Name, Description<br>Output: Group Info, Join Code |
| **B04** | **Join Group** | User | User gửi yêu cầu tham gia vào group qua ID hoặc `joinCode`. Trạng thái: `PENDING`. | Input: Group ID hoặc Join Code<br>Output: Request Status |
| **B05** | **Duyệt thành viên** | Manager | Manager xem danh sách yêu cầu `PENDING`. Duyệt (`APPROVED`) hoặc từ chối (`REJECTED`). | Input: Member ID, Action<br>Output: Updated Status |
| **B05.1** | **Nhật ký Vận hành Group (Manager Audit)** | Manager | Ghi nhận và truy vấn đầy đủ hoạt động trong group: ai thao tác gì, trên đối tượng nào, thay đổi trước/sau, thời điểm, khung ngày/tháng. | Input: Group ID, Filters, Date Range<br>Output: Audit Logs, Daily/Monthly Summary |
| **B06** | **Quản lý Vị trí** | Manager | Định nghĩa các vị trí làm việc trong quán (VD: Phục vụ, Pha chế, Bảo vệ). | Input: Name<br>Output: Position ID |
| **B07** | **Cấu hình Ca Mẫu (Shift Template)** | Manager | Tạo các khung giờ làm việc mẫu (VD: Ca Sáng 7-12h, Ca Chiều 12-17h). Giúp tạo lịch nhanh hơn. | Input: Name, Start, End<br>Output: Template ID |
| **B08** | **Khai báo Lịch rảnh** | Member | Member khai báo khung giờ rảnh theo thứ trong tuần (T2-CN). Hệ thống sẽ so khớp với giờ của Ca để gợi ý. | Input: Day, Start, End<br>Output: Availability ID |
| **B09** | **Tạo Ca làm việc** | Manager | Tạo ca làm việc cho một ngày cụ thể. Có thể chọn từ `ShiftTemplate` hoặc nhập thủ công. Hỗ trợ tạo hàng loạt cho cả tuần. | Input: Date, Template ID (opt), Start, End<br>Output: Shift ID |
| **B10** | **Cấu hình Nhu cầu** | Manager | Xác định mỗi ca cần bao nhiêu người cho từng vị trí (VD: 2 Phục vụ, 1 Pha chế). Có thể cấu hình mặc định theo Template. | Input: Shift, Position, Quantity<br>Output: Requirement ID |
| **B11** | **Xem Ca phù hợp** | Member | Hệ thống hiển thị các ca `OPEN` chưa đủ người, member có lịch rảnh bao trùm ca (`Avail.Start <= Shift.Start` && `Avail.End >= Shift.End`). | Input: Date Range<br>Output: List Shifts |
| **B12** | **Đăng ký Ca** | Member | Member đăng ký vào 1 vị trí trong ca. Tạo `Registration` (`PENDING`). | Input: Shift ID, Position ID<br>Output: Registration ID |
| **B13** | **Hủy Đăng ký** | Member | Member hủy đăng ký. Chỉ được hủy khi ca chưa `LOCKED` và chưa bắt đầu (theo quy định giờ). | Input: Reg ID, Reason<br>Output: Status CANCELLED |
| **B14** | **Duyệt Ca** | Manager | Manager duyệt đăng ký của member. Kiểm tra `ShiftRequirement` còn slot không. | Input: Reg ID<br>Output: Status APPROVED |
| **B15** | **Từ chối Ca** | Manager | Manager từ chối đăng ký (VD: member không phù hợp, ưu tiên người khác). | Input: Reg ID, Reason<br>Output: Status REJECTED |
| **B16** | **Gán nhân viên** | Manager | Manager bỏ qua quy trình đăng ký, gán trực tiếp member vào vị trí trong ca. | Input: User ID, Shift ID, Pos ID<br>Output: Reg APPROVED |
| **B17** | **Cảnh báo Thiếu người** | System | Tự động đánh dấu các ca sắp đến giờ làm mà chưa đủ số lượng `APPROVED` so với `Requirement`. | Output: Alert/Highlight UI |
| **B18** | **Gợi ý Nhân viên** | System | Tìm member có `Availability` bao trùm khung giờ ca và chưa có lịch trùng. | Output: List Suggested Users |
| **B19** | **Xem Lịch cá nhân** | Member | Xem danh sách các ca đã được `APPROVED` của bản thân theo tuần/tháng. | Output: Calendar View |
| **B20** | **Khóa Ca (Lock)** | System | Tự động hoặc Manager thủ công chuyển trạng thái ca sang `LOCKED` (không cho sửa đổi). | Input: Shift ID<br>Output: Status LOCKED |
| **B21** | **Yêu cầu Đổi ca** | Member | Member muốn đổi ca đã `APPROVED` sang một ca khác (hoặc chỉ xin hủy có lý do đặc biệt). | Input: From Shift, To Shift<br>Output: Request PENDING |
| **B22** | **Duyệt Đổi ca** | Manager | Manager xem xét yêu cầu đổi. Nếu duyệt: Hủy ca cũ, Đăng ký ca mới (nếu có). | Input: Request ID, Action<br>Output: Updated Regs |
| **B23** | **Quản lý Hệ thống (Admin)** | Admin | Quản trị toàn hệ thống: quản lý user/group, theo dõi sức khỏe hệ thống theo ngày/tháng, xử lý cảnh báo vận hành, và lưu audit thao tác quản trị. | Input: Action, Target ID, Date Range<br>Output: Updated Status, Admin Dashboard Metrics |
| **B24** | **Cấu hình Lương** | Manager | Thiết lập mức lương theo giờ cho từng Vị trí hoặc từng Nhân viên. | Input: Position/User, Rate<br>Output: Salary Config ID |
| **B25** | **Xem Bảng lương (Payroll)** | Manager | Xem thống kê tổng giờ làm và lương dự kiến của nhân viên theo tháng. | Input: Month, Year<br>Output: Payroll Report |
| **B26** | **Báo cáo Hoạt động (Performance Report)** | Manager | Thống kê số ca, tổng giờ làm theo tuần/tháng để so sánh hiệu suất. | Input: Date Range<br>Output: Chart/Table Data |

---

## II. MÔ HÌNH THỰC THỂ (DATABASE SCHEMA)

> **Quy ước chung**: Tất cả bảng đều có các trường Audit:
> - `created_at` (datetime, default NOW)
> - `updated_at` (datetime, on update NOW)

### 1. User (Người dùng hệ thống)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | ID định danh |
| `username` | String | Unique, Not Null | Tên đăng nhập |
| `email` | String | Unique, Not Null | Email liên hệ |
| `password` | String | Not Null | Mật khẩu (Hashed) |
| `full_name` | String | Not Null | Họ tên hiển thị |
| `phone` | String | Nullable | Số điện thoại |
| `status` | Enum | ACTIVE, BANNED | Trạng thái tài khoản |
| `global_role` | Enum | ADMIN, USER | Vai trò hệ thống (Admin quản trị web, User là người dùng) |

### 2. Group (Quán/Cửa hàng)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | ID nhóm |
| `name` | String | Not Null | Tên quán |
| `description` | String | Nullable | Mô tả thêm |
| `join_code` | String(6) | Unique, Nullable | Mã tham gia group, sinh tự động |
| `created_by` | User ID | FK | Người tạo (Owner) |
| `status` | Enum | ACTIVE, INACTIVE | Trạng thái hoạt động |

### 3. GroupMember (Thành viên nhóm)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `group_id` | Group ID | FK | Thuộc group nào |
| `user_id` | User ID | FK | User nào |
| `role` | Enum | MANAGER, MEMBER | Vai trò trong group này |
| `status` | Enum | PENDING, APPROVED, REJECTED, BANNED | Trạng thái tham gia |
| `joined_at` | DateTime | | Ngày gia nhập chính thức |

### 4. Position (Vị trí làm việc)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `group_id` | Group ID | FK | Vị trí thuộc quán nào |
| `name` | String | Not Null | Tên vị trí (Pha chế, Thu ngân...) |
| `color_code` | String | Nullable | Mã màu hiển thị trên lịch (VD: #FF0000) |

### 5. Availability (Lịch rảnh)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `user_id` | User ID | FK | Của user nào |
| `group_id` | Group ID | FK | Trong group nào |
| `day_of_week` | Enum/Int | 1-7 (Mon-Sun) | Thứ trong tuần |
| `start_time` | Time | Not Null | Giờ bắt đầu rảnh |
| `end_time` | Time | Not Null | Giờ kết thúc rảnh |

### 6. ShiftTemplate (Ca Mẫu) - Mới
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `group_id` | Group ID | FK | Thuộc group nào |
| `name` | String | Not Null | Tên ca mẫu (Sáng, Chiều...) |
| `start_time` | Time | Not Null | Giờ bắt đầu chuẩn |
| `end_time` | Time | Not Null | Giờ kết thúc chuẩn |
| `description` | String | Nullable | Mô tả |

### 7. Shift (Ca làm việc)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `group_id` | Group ID | FK | Ca của quán nào |
| `template_id` | Template ID | Nullable FK | Link đến template (nếu có) |
| `name` | String | Nullable | Tên ca (Sáng, Chiều, Tối, Ca gãy...) |
| `date` | Date | Not Null | Ngày làm việc |
| `start_time` | Time | Not Null | Giờ bắt đầu |
| `end_time` | Time | Not Null | Giờ kết thúc |
| `status` | Enum | OPEN, LOCKED, COMPLETED | Trạng thái ca |
| `note` | String | Nullable | Ghi chú cho nhân viên (VD: "Đông khách, cần tập trung") |

### 8. ShiftRequirement (Nhu cầu nhân sự)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `shift_id` | Shift ID | FK | Thuộc ca nào |
| `position_id` | Position ID | FK | Cần vị trí nào |
| `quantity` | Int | Min 1 | Số lượng cần thiết |

### 9. Registration (Đăng ký ca) ⭐
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `shift_id` | Shift ID | FK | Đăng ký ca nào |
| `user_id` | User ID | FK | Ai đăng ký |
| `position_id` | Position ID | FK | Đăng ký vị trí nào |
| `status` | Enum | PENDING, APPROVED, REJECTED, CANCELLED | Trạng thái đăng ký |
| `note` | String | Nullable | Ghi chú của member khi đăng ký |
| `manager_note`| String | Nullable | Ghi chú của manager khi duyệt/từ chối |

### 10. ShiftChangeRequest (Yêu cầu đổi ca)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `user_id` | User ID | FK | Người yêu cầu |
| `group_id` | Group ID | FK | Trong group nào |
| `from_shift_id`| Shift ID | FK | Ca hiện tại (muốn bỏ) |
| `to_shift_id` | Shift ID | Nullable FK | Ca mong muốn (muốn vào) - Null nếu chỉ xin nghỉ |
| `reason` | String | Nullable | Lý do đổi |
| `status` | Enum | PENDING, APPROVED, REJECTED | Trạng thái yêu cầu |
| `manager_note`| String | Nullable | Phản hồi của quản lý |

### 11. SalaryConfig (Cấu hình Lương)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | |
| `group_id` | Group ID | FK | |
| `position_id` | Position ID | Nullable FK | Lương theo vị trí (VD: Phục vụ 20k/h) |
| `user_id` | User ID | Nullable FK | Lương riêng cho nhân viên (VD: A làm tốt 25k/h) |
| `hourly_rate` | Decimal | Min 0 | Mức lương theo giờ |
| `effective_date`| Date | Not Null | Ngày bắt đầu áp dụng |

### 12. GroupAuditLog (Nhật ký vận hành Group) - Mới
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Long | PK | ID bản ghi log |
| `group_id` | Group ID | FK, Not Null | Group phát sinh sự kiện |
| `actor_user_id` | User ID | FK, Not Null | Người thực hiện thao tác |
| `actor_role` | Enum | MANAGER, MEMBER, SYSTEM | Vai trò lúc thao tác |
| `action_type` | String | Not Null, Indexed | Mã hành động (VD: REGISTRATION_APPROVED) |
| `entity_type` | String | Not Null | Loại đối tượng bị tác động (GROUP_MEMBER, SHIFT, REGISTRATION, ...) |
| `entity_id` | UUID/Long | Not Null | ID đối tượng bị tác động |
| `occurred_at` | DateTime | Not Null, Indexed | Thời điểm xảy ra |
| `summary` | String | Not Null | Mô tả ngắn cho UI timeline |
| `before_data` | JSON | Nullable | Dữ liệu trước thay đổi |
| `after_data` | JSON | Nullable | Dữ liệu sau thay đổi |
| `metadata` | JSON | Nullable | Thông tin phụ (ip, user-agent, request-id, shift date/time...) |

---

## III. LUỒNG NGƯỜI DÙNG (USER FLOW)

### 1. Luồng Nhân viên (MEMBER)
1.  **Đăng nhập** -> Dashboard (Hiện danh sách Group).
2.  **Chọn Group** -> Trang chủ Group.
3.  **Khai báo Lịch rảnh**: Vào menu "Lịch rảnh" -> Chọn thứ/giờ -> Lưu.
4.  **Đăng ký Ca**:
    *   Vào menu "Đăng ký ca" (Lịch tuần).
    *   Thấy các ô ca màu Xanh (Còn trống) / Xám (Đã đủ/Khóa).
    *   Click vào ca -> Chọn vị trí -> Bấm "Đăng ký".
    *   Trạng thái chuyển sang "Chờ duyệt" (Vàng).
5.  **Xem Lịch làm**:
    *   Vào menu "Lịch của tôi".
    *   Thấy các ca đã "Duyệt" (Xanh lá).
    *   Nếu bận: Click vào ca -> Chọn "Xin đổi/Hủy" -> Nhập lý do -> Gửi.

### 2. Luồng Quản lý (MANAGER)
1.  **Đăng nhập** -> Dashboard -> Chọn Group quản lý.
2.  **Cấu hình** (Lần đầu): Tạo Vị trí (Position).
3.  **Lên lịch**:
    *   Vào "Quản lý ca".
    *   Tạo ca mới (Ngày, Giờ).
    *   Thêm nhu cầu (Cần 2 Pha chế, 3 Phục vụ).
4.  **Duyệt Ca**:
    *   Trên lịch tuần, thấy ô ca có icon báo hiệu "Có đăng ký mới".
    *   Click vào ca -> Xem danh sách đăng ký.
    *   Bấm "Duyệt" hoặc "Từ chối".
5.  **Phân ca chủ động**:
    *   Nếu thiếu người: Click vào nút "Gợi ý".
    *   Hệ thống list ra nhân viên rảnh khung giờ đó.
    *   Chọn nhân viên -> Gán vào ca.
6.  **Xử lý Đổi ca**:
    *   Vào menu "Yêu cầu đổi ca".
    *   Xem lý do -> Duyệt (Hệ thống tự động cập nhật lại lịch) hoặc Từ chối.

### 3. Luồng Quản trị hệ thống (ADMIN)
1.  **Đăng nhập Admin** -> Vào trang "System Admin Dashboard".
2.  **Theo dõi vận hành ngày**:
    *   Xem số user active trong ngày, số login thất bại, số token refresh bất thường, số group bị report.
    *   Xem danh sách cảnh báo mức `HIGH` cần xử lý ngay.
3.  **Theo dõi vận hành tháng**:
    *   Xem tăng trưởng user/group theo tháng.
    *   Xem tỷ lệ user bị khóa/mở khóa, xu hướng đăng nhập thất bại, tần suất cảnh báo.
4.  **Quản trị đối tượng hệ thống**:
    *   Tìm kiếm user/group theo trạng thái.
    *   Khóa/mở tài khoản user, khóa/mở group vi phạm.
5.  **Kiểm soát thay đổi**:
    *   Tất cả hành động quản trị được ghi audit (ai làm, lúc nào, tác động lên đối tượng nào, trạng thái trước/sau).

---

## IV. NGUYÊN TẮC KỸ THUẬT & RÀNG BUỘC (CONSTRAINTS)

1.  **Unique Constraint**:
    *   Một nhân viên không thể có 2 `Registration` trạng thái `APPROVED` trùng hoặc giao nhau về thời gian (trong cùng 1 Group hoặc khác Group - *Tùy chọn nâng cao, ở đây scope MVP chỉ check trong cùng Group*).
    *   `GroupMember`: Cặp `(user_id, group_id)` phải duy nhất.
    *   `Group.join_code` phải duy nhất toàn hệ thống (khi có giá trị).
2.  **Data Integrity**:
    *   Số lượng `Registration (APPROVED)` của một `Position` trong `Shift` không được vượt quá `ShiftRequirement.quantity` (trừ khi Manager force assign).
3.  **Business Rules**:
    *   Không thể thao tác (Đăng ký/Hủy/Duyệt) trên `Shift` có status `LOCKED` hoặc `COMPLETED`.
    *   Manager chỉ được duyệt nhân viên thuộc Group mình quản lý.
    *   Dữ liệu `Availability`, `Shift`, `Registration` phải luôn gắn với `group_id` để đảm bảo tính cách ly dữ liệu (Multi-tenancy logic).
4.  **Auth Token Rules**:
    *   Access token và refresh token phải tách riêng secret + TTL.
    *   Refresh token được lưu hash (`SHA-256`) tại DB và có trạng thái revoke.
    *   Khi gọi refresh thành công, refresh token cũ bị revoke và phát cặp token mới (rotation).
    *   Logout thực hiện revoke các refresh token active của user.
5.  **Admin Governance Rules**:
    *   Chỉ `global_role = ADMIN` mới truy cập các API quản trị hệ thống.
    *   Tất cả thao tác khóa/mở user/group phải ghi audit trail.
    *   Dashboard admin bắt buộc có số liệu theo ngày và theo tháng để theo dõi ổn định hệ thống.
    *   Số liệu tổng hợp theo thời gian phải hỗ trợ timezone thống nhất (mặc định Asia/Ho_Chi_Minh).
6.  **Group Audit Rules**:
    *   Manager chỉ xem được audit logs của group mình có quyền `MANAGER` và trạng thái `APPROVED`.
    *   Các sự kiện quan trọng bắt buộc ghi log: join/approve/reject member, tạo/sửa/khóa ca, đăng ký/duyệt/hủy ca, gán nhân viên.
    *   Audit log phải lưu `actor`, `action_type`, `entity`, `occurred_at`, và cặp `before_data`/`after_data` khi có thay đổi trạng thái.
    *   Truy vấn audit bắt buộc hỗ trợ filter theo ngày, action type, actor, entity và phân trang.

---
*Tài liệu này dùng làm căn cứ chính xác nhất để phát triển Database và API.*

## V. DANH SÁCH CÔNG VIỆC THEO CHỨC NĂNG (IMPLEMENTATION CHECKLIST)

### B01 Đăng ký tài khoản
- Backend: POST /api/v1/auth/register; validate unique email/username; hash password; trả thông tin user đã tạo.
- Dữ liệu: Unique email/username; status ACTIVE; global_role USER.
- Frontend: Form đăng ký; xử lý lỗi; auto login/redirect.
- Kiểm thử: Unit hash/validation; integration user được tạo đúng.

### B02 Đăng nhập
- Backend: POST /api/v1/auth/login nhận username/email + password; trả access token + refresh token + thông tin cơ bản; chặn BANNED.
- Bảo mật: Access/Refresh tách riêng secret + TTL, token_type claim, jti random; stateless filter chain.
- Frontend: Form login; lưu access token/refresh token an toàn; redirect dashboard.
- Kiểm thử: Sai mật khẩu; tài khoản khóa; thành công nhận đủ cặp token.

### B02.1 Làm mới Access Token
- Backend: POST /api/v1/auth/refresh nhận refresh token; verify token + verify hash DB + kiểm tra chưa revoke/chưa hết hạn.
- Logic: Refresh rotation (revoke refresh token cũ, phát access token mới + refresh token mới).
- Frontend: Interceptor khi access token hết hạn gọi refresh; cập nhật lại token lưu cục bộ.
- Kiểm thử: Refresh thành công; reject refresh token cũ sau rotation; reject token invalid/expired.

### B02.2 Đăng xuất
- Backend: POST /api/v1/auth/logout; yêu cầu access token hợp lệ; revoke toàn bộ refresh token active của user.
- Bảo mật: Logout có hiệu lực ở lớp refresh token; access token cũ hết hiệu lực theo TTL.
- Frontend: Xóa access token/refresh token local sau logout API thành công.
- Kiểm thử: Logout thành công; refresh token cũ không dùng lại được.

### B03 Tạo Group (Quán)
- Backend: POST /api/v1/groups; người tạo auto MANAGER; created_by liên kết; chỉ người đăng nhập.
- Dữ liệu: Group status ACTIVE; sinh `joinCode` 6 ký tự in hoa + số, đảm bảo unique.
- Frontend: Form tạo group; danh sách group của tôi.
- Kiểm thử: Tạo thành công; vai trò MANAGER được gán; joinCode có độ dài 6.

### B04 Join Group
- Backend: POST /api/v1/groups/{id}/join hoặc POST /api/v1/groups/join-by-code -> GroupMember PENDING; chống trùng (user_id, group_id).
- Dữ liệu: Composite unique cho GroupMember; khởi tạo PENDING.
- Frontend: Nút tham gia bằng mã; hiển thị trạng thái yêu cầu.
- Kiểm thử: Không tạo trùng; join theo mã hoạt động.

### B05 Duyệt thành viên
- Backend: GET /api/v1/groups/{id}/members/pending và PATCH /api/v1/groups/{id}/members/{memberId} (APPROVE/REJECT); chỉ MANAGER group đó.
- Bảo mật: Check role MANAGER; multi-tenancy theo group_id.
- Frontend: Bảng yêu cầu PENDING; duyệt/từ chối kèm lý do.
- Kiểm thử: Duyệt; từ chối; bảo vệ quyền.

### B06 Quản lý Vị trí
- Backend: CRUD /api/v1/groups/{id}/positions; name bắt buộc; optional color_code.
- Dữ liệu: Position gắn group_id; name duy nhất trong group.
- Frontend: Màn cấu hình vị trí; chọn màu hiển thị lịch.
- Kiểm thử: Tạo/sửa/xóa; quyền MANAGER.

### B07 Cấu hình Ca Mẫu
- Backend: CRUD /api/v1/groups/{id}/shift-templates; name/start/end; optional description.
- Dữ liệu: Validate khoảng giờ; tránh giao nhau tùy chính sách.
- Frontend: Quản lý ca mẫu; tạo nhanh ca.
- Kiểm thử: Validate thời gian; CRUD đúng group.

### B08 Khai báo Lịch rảnh
- Backend: CRUD /api/v1/groups/{id}/availability; day_of_week, start_time, end_time; một user nhiều slot.
- Ràng buộc: start < end; gắn group_id; chặn chồng lấn (khuyến nghị).
- Frontend: UI chọn thứ/giờ theo tuần; danh sách slot.
- Kiểm thử: Tạo hợp lệ; từ chối slot chồng lấn.

### B09 Tạo Ca làm việc
- Backend: POST /api/v1/groups/{id}/shifts; từ template hoặc thủ công; hỗ trợ batch tạo tuần.
- Dữ liệu: status OPEN mặc định; validate date + thời gian.
- Frontend: Form tạo ca; batch tạo tuần.
- Kiểm thử: Tạo đơn/loạt; liên kết template_id.

### B10 Cấu hình Nhu cầu
- Backend: POST /api/v1/shifts/{id}/requirements thêm position + quantity; prefill từ template.
- Ràng buộc: quantity >= 1; không trùng position trong cùng shift.
- Frontend: UI thêm/sửa nhu cầu theo vị trí; tổng số cần.
- Kiểm thử: Đúng số lượng; cản duplicate.

### B11 Xem Ca phù hợp
- Backend: GET /api/v1/groups/{id}/shifts?fit=me&range=... lọc OPEN, còn thiếu, availability bao trùm.
- Logic: Avail.Start <= Shift.Start && Avail.End >= Shift.End; loại trừ lịch trùng đã APPROVED.
- Frontend: Lịch tuần màu/trạng thái; bộ lọc phù hợp.
- Kiểm thử: Danh sách chính xác theo khung giờ.

### B12 Đăng ký Ca
- Backend: POST /api/v1/shifts/{id}/register với position_id; Registration PENDING; check LOCKED.
- Ràng buộc: Không đăng ký trùng ca; gắn group_id; note tùy chọn.
- Frontend: Button đăng ký trong card ca; chọn vị trí.
- Kiểm thử: PENDING tạo đúng; chặn khi LOCKED.

### B13 Hủy Đăng ký
- Backend: PATCH /api/v1/registrations/{id}/cancel với lý do; chỉ khi chưa LOCKED và trước giờ bắt đầu.
- Logic: So giờ hệ thống; status -> CANCELLED.
- Frontend: Hành động hủy; confirm; nhập lý do.
- Kiểm thử: Chặn sau giờ; chặn khi LOCKED.

### B14 Duyệt Ca
- Backend: PATCH /api/v1/registrations/{id}/approve; trừ slot trong ShiftRequirement; check đủ chỗ.
- Ràng buộc: Không vượt quantity; member thuộc group.
- Frontend: Danh sách PENDING theo ca; nút duyệt.
- Kiểm thử: Approve đúng; reject khi hết slot.

### B15 Từ chối Ca
- Backend: PATCH /api/v1/registrations/{id}/reject với lý do; cập nhật manager_note.
- Ràng buộc: Trạng thái -> REJECTED; lưu audit.
- Frontend: Nút từ chối + nhập lý do; hiển thị kết quả.
- Kiểm thử: Đổi trạng thái; lưu lý do.

### B16 Gán nhân viên
- Backend: POST /api/v1/shifts/{id}/assign với user_id, position_id; đặt Registration APPROVED bỏ qua PENDING.
- Ràng buộc: Tôn trọng quantity; có thể force nếu cho phép; chặn LOCKED.
- Frontend: Quick assign từ UI ca; xem gợi ý trước khi gán.
- Kiểm thử: Gán thành công; không vượt slot.

### B17 Cảnh báo Thiếu người
- Backend: Job định kỳ hoặc query realtime đánh dấu ca sắp đến giờ còn thiếu APPROVED so với Requirement.
- Dữ liệu/UI: Flag/field hoặc computed; expose qua API.
- Frontend: Badge/cảnh báo trên lịch; filter “Thiếu người”.
- Kiểm thử: Case cận giờ; cập nhật trạng thái.

### B18 Gợi ý Nhân viên
- Backend: GET /api/v1/shifts/{id}/suggestions trả danh sách member availability bao trùm và không lịch trùng.
- Logic: Loại trừ người đã APPROVED ca trùng/overlap; cân nhắc ưu tiên.
- Frontend: Modal danh sách gợi ý + nút gán.
- Kiểm thử: Đúng logic bao phủ; không trùng lịch.

### B19 Xem Lịch cá nhân
- Backend: GET /api/v1/me/calendar?range=... trả các registration APPROVED.
- Dữ liệu: Join Shift + Position để render đầy đủ.
- Frontend: View calendar riêng; màu theo vị trí.
- Kiểm thử: Range chính xác; chỉ dữ liệu người dùng.

### B20 Khóa Ca (Lock)
- Backend: PATCH /api/v1/shifts/{id}/lock (MANAGER) hoặc auto job; chuyển status LOCKED.
- Logic: Chặn thao tác sau LOCKED; điều kiện thời gian.
- Frontend: Hành động khóa; hiển thị trạng thái.
- Kiểm thử: Không thể đăng ký/hủy sau LOCKED.

### B21 Yêu cầu Đổi ca
- Backend: POST /api/v1/shift-change-requests từ APPROVED hiện tại sang ca khác hoặc xin nghỉ; status PENDING.
- Dữ liệu: from_shift_id bắt buộc; to_shift_id nullable khi xin nghỉ; reason tùy chọn.
- Frontend: Form yêu cầu đổi/hủy; danh sách yêu cầu.
- Kiểm thử: Tạo đúng; ràng buộc nguồn là APPROVED.

### B22 Duyệt Đổi ca
- Backend: PATCH /api/v1/shift-change-requests/{id} approve/reject; nếu approve: hủy reg cũ, tạo/approve reg mới nếu có to_shift.
- Logic: Tôn trọng requirement ca mới; audit manager_note.
- Frontend: Màn duyệt yêu cầu; hiển thị kết quả.
- Kiểm thử: Luồng approve/reject; đồng bộ lịch.

### B23 Quản lý Hệ thống (Admin)
- Backend:
  - `GET /api/v1/admin/users` (lọc theo trạng thái, từ khóa, phân trang)
  - `PATCH /api/v1/admin/users/{id}/status` (ACTIVE/BANNED)
  - `GET /api/v1/admin/groups` (lọc theo trạng thái, từ khóa, phân trang)
  - `PATCH /api/v1/admin/groups/{id}/status` (ACTIVE/INACTIVE)
  - `GET /api/v1/admin/metrics/daily?date=...`
  - `GET /api/v1/admin/metrics/monthly?month=...&year=...`
  - `GET /api/v1/admin/audit-logs?from=...&to=...`
- Dữ liệu: status chuyển BANNED/INACTIVE; log audit đầy đủ before/after + actor + timestamp.
- Frontend: Trang Admin gồm dashboard chỉ số ngày/tháng, bảng user/group, lịch sử audit.
- Kiểm thử: Quyền admin; tác động đúng đối tượng; tính đúng chỉ số daily/monthly.

### B05.1 Nhật ký Vận hành Group (Manager Audit)
- Backend:
  - `GET /api/v1/groups/{id}/audit-logs?from=...&to=...&actionType=...&actorUserId=...&entityType=...&entityId=...&page=...`
  - `GET /api/v1/groups/{id}/audit-logs/summary/daily?date=...`
  - `GET /api/v1/groups/{id}/audit-logs/summary/monthly?month=...&year=...`
- Dữ liệu: Bảng `group_audit_logs` + index `(group_id, occurred_at)` và `(group_id, action_type, occurred_at)`.
- Frontend: Màn timeline hoạt động của group, bộ lọc nhanh theo ngày/sự kiện/thành viên, widget summary ngày-tháng.
- Kiểm thử: Manager đúng quyền; filter đúng; phân trang đúng; có log cho toàn bộ thao tác trọng yếu.

### B24 Cấu hình Lương
- Backend: CRUD /api/v1/groups/{id}/salary-configs theo vị trí hoặc người dùng; hiệu lực effective_date.
- Ràng buộc: hourly_rate >= 0; ưu tiên user-specific > position-specific.
- Frontend: Form cấu hình; timeline hiệu lực.
- Kiểm thử: Tính ưu tiên; CRUD hợp lệ.

### B25 Xem Bảng lương (Payroll)
- Backend: GET /api/v1/groups/{id}/payroll?month=... tổng hợp giờ làm từ registrations APPROVED + thời gian shift; áp dụng SalaryConfig.
- Tính toán: Tổng giờ = sum(end-start) theo ca; xử lý ca gãy nếu có.
- Frontend: Bảng/biểu đồ; export CSV.
- Kiểm thử: Đúng số giờ/lương; edge khi thiếu config.

### B26 Báo cáo Hoạt động
- Backend: GET /api/v1/groups/{id}/performance?range=... trả số ca, tổng giờ theo tuần/tháng; nhóm theo user/position.
- Dữ liệu: Aggregation, indexes tối ưu query.
- Frontend: Chart line/bar, filter range; drilldown.
- Kiểm thử: Đúng số liệu; hiệu năng với dữ liệu lớn.

---

## VI. API ĐÃ TRIỂN KHAI (BACKEND)

### 1. Auth
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | POST | Public | Đăng ký tài khoản mới |
| `/api/v1/auth/login` | POST | Public | Đăng nhập, trả access token + refresh token |
| `/api/v1/auth/refresh` | POST | Public | Refresh access token, rotate refresh token |
| `/api/v1/auth/logout` | POST | Bearer | Đăng xuất, revoke refresh token active |

### 2. Group
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/groups/my-groups` | GET | Bearer | Danh sách group user đang tham gia |
| `/api/v1/groups` | POST | Bearer | Tạo group, auto assign MANAGER, sinh joinCode |
| `/api/v1/groups/{id}/join` | POST | Bearer | Gửi yêu cầu tham gia group theo ID |
| `/api/v1/groups/join-by-code` | POST | Bearer | Gửi yêu cầu tham gia group theo joinCode |
| `/api/v1/groups/{id}/members` | GET | Bearer | Danh sách thành viên trong group |
| `/api/v1/groups/{id}/members/pending` | GET | Bearer (MANAGER) | Lấy danh sách thành viên chờ duyệt |
| `/api/v1/groups/{id}/members/{memberId}` | PATCH | Bearer (MANAGER) | Duyệt hoặc từ chối thành viên (`APPROVE`/`REJECT`) |
| `/api/v1/groups/{id}/leave` | DELETE | Bearer | Rời group |

### 3. Group Manager Audit (B05.1)
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/groups/{id}/audit-logs` | GET | Bearer (MANAGER) | Nhật ký chi tiết hoạt động trong group (filter + phân trang) |
| `/api/v1/groups/{id}/audit-logs/summary/daily` | GET | Bearer (MANAGER) | Tổng hợp hoạt động group theo ngày |
| `/api/v1/groups/{id}/audit-logs/summary/monthly` | GET | Bearer (MANAGER) | Tổng hợp hoạt động group theo tháng |

### 4. Position (B06)
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/groups/{groupId}/positions` | POST | Bearer (MANAGER) | Tạo vị trí |
| `/api/v1/groups/{groupId}/positions` | GET | Bearer | Danh sách vị trí |
| `/api/v1/groups/{groupId}/positions/{positionId}` | PUT | Bearer (MANAGER) | Cập nhật vị trí |
| `/api/v1/groups/{groupId}/positions/{positionId}` | DELETE | Bearer (MANAGER) | Xóa vị trí |

### 5. Shift Template (B07)
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/groups/{groupId}/shift-templates` | POST | Bearer (MANAGER) | Tạo ca mẫu |
| `/api/v1/groups/{groupId}/shift-templates` | GET | Bearer | Danh sách ca mẫu |
| `/api/v1/groups/{groupId}/shift-templates/{templateId}` | PUT | Bearer (MANAGER) | Cập nhật ca mẫu |
| `/api/v1/groups/{groupId}/shift-templates/{templateId}` | DELETE | Bearer (MANAGER) | Xóa ca mẫu |

### 6. Shift (B09)
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/groups/{groupId}/shifts` | POST | Bearer (MANAGER) | Tạo ca làm việc |
| `/api/v1/groups/{groupId}/shifts/bulk` | POST | Bearer (MANAGER) | Tạo ca hàng loạt |

### 7. Shift Requirement (B10)
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/shifts/{shiftId}/requirements` | POST | Bearer (MANAGER) | Tạo nhu cầu |
| `/api/v1/shifts/{shiftId}/requirements` | GET | Bearer | Danh sách nhu cầu của ca |
| `/api/v1/shifts/{shiftId}/requirements/{requirementId}` | PATCH | Bearer (MANAGER) | Cập nhật nhu cầu |
| `/api/v1/shifts/{shiftId}/requirements/{requirementId}` | DELETE | Bearer (MANAGER) | Xóa nhu cầu |

### 8. Admin (Kế hoạch triển khai)
| API | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/users` | GET | Bearer (ADMIN) | Danh sách user toàn hệ thống, hỗ trợ lọc/phân trang |
| `/api/v1/admin/users/{id}/status` | PATCH | Bearer (ADMIN) | Khóa/mở user (`ACTIVE`/`BANNED`) |
| `/api/v1/admin/groups` | GET | Bearer (ADMIN) | Danh sách group toàn hệ thống, hỗ trợ lọc/phân trang |
| `/api/v1/admin/groups/{id}/status` | PATCH | Bearer (ADMIN) | Khóa/mở group (`ACTIVE`/`INACTIVE`) |
| `/api/v1/admin/metrics/daily` | GET | Bearer (ADMIN) | Chỉ số vận hành theo ngày |
| `/api/v1/admin/metrics/monthly` | GET | Bearer (ADMIN) | Chỉ số vận hành theo tháng |
| `/api/v1/admin/audit-logs` | GET | Bearer (ADMIN) | Lịch sử thao tác quản trị hệ thống |

---

## VII. BẢNG CHI TIẾT ACTION TYPE CHO GROUP AUDIT

| Action Type | Khi phát sinh | Entity Type | Before/After yêu cầu |
| :--- | :--- | :--- | :--- |
| `GROUP_MEMBER_JOIN_REQUESTED` | Member gửi yêu cầu vào group | GROUP_MEMBER | `after_data` |
| `GROUP_MEMBER_APPROVED` | Manager duyệt thành viên | GROUP_MEMBER | `before_data` + `after_data` |
| `GROUP_MEMBER_REJECTED` | Manager từ chối thành viên | GROUP_MEMBER | `before_data` + `after_data` |
| `SHIFT_CREATED` | Manager tạo ca | SHIFT | `after_data` |
| `SHIFT_UPDATED` | Manager sửa ca | SHIFT | `before_data` + `after_data` |
| `SHIFT_LOCKED` | Manager/System khóa ca | SHIFT | `before_data` + `after_data` |
| `REGISTRATION_CREATED` | Member đăng ký ca | REGISTRATION | `after_data` |
| `REGISTRATION_APPROVED` | Manager duyệt đăng ký ca | REGISTRATION | `before_data` + `after_data` |
| `REGISTRATION_REJECTED` | Manager từ chối đăng ký ca | REGISTRATION | `before_data` + `after_data` |
| `REGISTRATION_CANCELLED` | Member hủy đăng ký ca | REGISTRATION | `before_data` + `after_data` |
| `MANAGER_ASSIGNED_MEMBER` | Manager gán nhân viên thủ công | REGISTRATION | `after_data` |
| `SHIFT_REQUIREMENT_UPDATED` | Manager cập nhật nhu cầu nhân sự | SHIFT_REQUIREMENT | `before_data` + `after_data` |
