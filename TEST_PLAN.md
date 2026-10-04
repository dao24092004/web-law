# HƯỚNG DẪN TEST TOÀN BỘ HỆ THỐNG - VP LUẬT

> **Dành cho khách hàng** - Hướng dẫn chi tiết từng bước để kiểm thử toàn bộ giao diện website và trang quản trị.
> Thời gian ước tính: **3-4 giờ** cho toàn bộ.

---

## MỤC LỤC

- [Phần 1: Chuẩn bị trước khi test](#phần-1-chuẩn-bị-trước-khi-test)
- [Phần 2: Test website công khai (Khách truy cập)](#phần-2-test-website-công-khách-khách-truy-cập)
- [Phần 3: Đăng nhập trang quản trị](#phần-3-đăng-nhập-trang-quản-trị)
- [Phần 4: Test các chức năng quản trị](#phần-4-test-các-chức-năng-quản-trị)
- [Phần 5: Báo cáo lỗi](#phần-5-báo-lỗi)
- [Phần 6: Phiếu test nhanh](#phần-6-phiếu-test-nhanh)

---

## PHẦN 1: CHUẨN BỊ TRƯỚC KHI TEST

### 🌐 Đường dẫn cần test

| Loại | Đường dẫn | Mô tả |
|------|-----------|--------|
| **Website chính** | `https://vpluat.vn` | Trang khách hàng |
| **Trang quản trị** | `https://admin.vpluat.vn` | Khu vực Admin |
| **Hoặc local** | `http://localhost:3000` | Nếu test trên máy |

### 💻 Yêu cầu thiết bị

- ✅ Máy tính có trình duyệt Chrome, Firefox hoặc Edge (phiên bản mới nhất)
- ✅ Điện thoại thông minh (để test responsive)
- ✅ Kết nối internet ổn định
- ✅ Tài khoản Admin (xem bảng bên dưới)

### 👥 Các tài khoản test (MÔI TRƯỜNG DEV/STAGING - KHÔNG DÙNG CHO PRODUCTION)

> ⚠️ **CẢNH BÁO BẢO MẬT**
> - Các mật khẩu dưới đây chỉ dành cho **môi trường dev/staging** để developer test.
> - **KHÔNG ĐƯỢC** dùng các mật khẩu này cho tài khoản production.
> - **KHÔNG ĐƯỢC** commit file này vào git public.
> - Với khách hàng, vui lòng tạo tài khoản riêng và cấp mật khẩu qua 1Password hoặc gọi điện trực tiếp.

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn |
|---------|----------------|----------|-----------|
| **Super Admin** | `admin@lawfirm.vn` | `Super@Admin#2026!` | Toàn quyền |
| **Admin** | `admin@luathung.vn` | `Admin@VP#2026` | Quản lý chung |
| **Biên tập viên** | `editor@lawfirm.vn` | `Editor@VP#2026` | Viết bài, blog |
| **CSKH** | `cskh@lawfirm.vn` | `CSKH@VP#2026` | Quản lý lead |
| **Luật sư** | `lawyer1@lawfirm.vn` | `Lawyer@VP#2026` | Xem lịch cá nhân |
| **Khách hàng** | `user@lawfirm.vn` | `Client@VP#2026` | Đặt lịch |

### 📝 Chuẩn bị giấy bút

In hoặc chuẩn bị sẵn **Phiếu test nhanh** ở cuối tài liệu. Mỗi bước test:
- ✅ Đánh dấu **"Đạt"** nếu hoạt động đúng
- ❌ Đánh dấu **"Lỗi"** nếu có vấn đề
- 📝 Ghi chú lỗi vào cột **Ghi chú**

### 🔧 Bật chế độ Developer Tools (tùy chọn)

> Chỉ cần thiết nếu bạn muốn ghi lại log lỗi chi tiết.

1. Mở trang web cần test
2. Nhấn phím **F12** (hoặc **Ctrl+Shift+I** trên Windows / **Cmd+Opt+I** trên Mac)
3. Chọn tab **"Console"** để xem log lỗi
4. Nếu thấy lỗi đỏ → chụp màn hình gửi dev

---

## PHẦN 2: TEST WEBSITE CÔNG KHAI (KHÁCH TRUY CẬP)

> ⏱️ Thời gian: ~45 phút

---

### BƯỚC 2.1: Test trang chủ

**Cách test:**
1. Mở trình duyệt, truy cập `https://vpluat.vn`
2. Đợi trang load xong (khoảng 3-5 giây)

**Kiểm tra:**

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 2.1.1 | Logo VP Luật hiển thị đầu trang | ☐ | ☐ | |
| 2.1.2 | Menu điều hướng (Trang chủ, Dịch vụ, Luật sư, Blog, Liên hệ) hiển thị | ☐ | ☐ | |
| 2.1.3 | Banner/Hero chính hiển thị với tiêu đề và nút "Đặt lịch tư vấn" | ☐ | ☐ | |
| 2.1.4 | Click vào logo → quay về trang chủ | ☐ | ☐ | |
| 2.1.5 | Click vào "Dịch vụ" trong menu → chuyển sang trang dịch vụ | ☐ | ☐ | |
| 2.1.6 | Click vào "Luật sư" trong menu → chuyển sang trang luật sư | ☐ | ☐ | |
| 2.1.7 | Click "Đặt lịch tư vấn" trên banner → chuyển đến trang booking | ☐ | ☐ | |
| 2.1.8 | Phần "Về chúng tôi" hiển thị số năm kinh nghiệm | ☐ | ☐ | |
| 2.1.9 | Phần "Dịch vụ nổi bật" hiển thị các dịch vụ | ☐ | ☐ | |
| 2.1.10 | Footer hiển thị đầy đủ thông tin liên hệ, link mạng xã hội | ☐ | ☐ | |

**Nếu có lỗi ghi lại:** URL trang, mô tả lỗi, có chụp ảnh nếu được.

---

### BƯỚC 2.2: Test trang đặt lịch (Booking) - QUAN TRỌNG

> Đây là chức năng sinh doanh thu chính, cần test kỹ.

#### Bước 2.2.1: Mở trang booking
1. Truy cập `https://vpluat.vn/booking`
2. Đợi trang load

**Kiểm tra ban đầu:**

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 2.2.1.1 | Tiêu đề "Đặt lịch tư vấn pháp lý" hiển thị | ☐ | ☐ | |
| 2.2.1.2 | Thanh tiến trình 3 bước hiển thị: "Chọn dịch vụ → Chọn lịch → Thông tin" | ☐ | ☐ | |
| 2.2.1.3 | Câu hỏi "Bạn cần tư vấn về lĩnh vực nào?" hiển thị | ☐ | ☐ | |
| 2.2.1.4 | Các nút dịch vụ hiển thị: Tư Vấn Pháp Lý, Đại Diện Pháp Lý, Doanh Nghiệp, Ly Hôn... | ☐ | ☐ | |

#### Bước 2.2.2: Chọn dịch vụ
1. **Click vào nút "Doanh Nghiệp"** (KHÔNG có chữ "Luật" phía trước)
2. Quan sát:
   - Nút "Doanh Nghiệp" có đổi màu (đã chọn)
   - Nút "Tiếp theo" chuyển từ màu xám → màu xanh (có thể click)

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 2.2.2.1 | Nút "Doanh Nghiệp" đổi màu khi click | ☐ | ☐ | |
| 2.2.2.2 | Nút "Tiếp theo" chuyển sang màu xanh (không còn bị mờ) | ☐ | ☐ | |
| 2.2.2.3 | Click nút "Tiếp theo" → chuyển sang bước 2 | ☐ | ☐ | |

#### Bước 2.2.3: Chọn luật sư (bước 2)
1. Đợi danh sách luật sư load
2. **Click vào "LS. Nguyễn Văn Hùng"**
3. Sau đó click "Tiếp theo"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 2.2.3.1 | Danh sách luật sư hiển thị | ☐ | ☐ | |
| 2.2.3.2 | LS Nguyễn Văn Hùng hiển thị trong danh sách | ☐ | ☐ | |
| 2.2.3.3 | Click vào LS Hùng → đổi màu (đã chọn) | ☐ | ☐ | |
| 2.2.3.4 | Click "Tiếp theo" → chuyển sang bước 3 | ☐ | ☐ | |

#### Bước 2.2.4: Chọn ngày giờ (bước 3)
1. **Chọn một ngày** trong lịch (click vào ô ngày)
2. **Chọn một khung giờ** trống (click vào nút giờ)
3. Điền thông tin:
   - Họ tên: `Nguyễn Văn Test`
   - Email: `test@example.com`
   - Số điện thoại: `0912345678`
   - Ghi chú: `Test đặt lịch từ QA`
4. Click "Xác nhận đặt lịch"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 2.2.4.1 | Calendar hiển thị lịch | ☐ | ☐ | |
| 2.2.4.2 | Các ngày quá khứ bị mờ (không click được) | ☐ | ☐ | |
| 2.2.4.3 | Các ngày trong tương lai có thể click | ☐ | ☐ | |
| 2.2.4.4 | Click ngày → đổi màu | ☐ | ☐ | |
| 2.2.4.5 | Sau khi chọn ngày, các khung giờ trống hiển thị | ☐ | ☐ | |
| 2.2.4.6 | Click giờ → đổi màu | ☐ | ☐ | |
| 2.2.4.7 | Form thông tin khách hàng hiển thị | ☐ | ☐ | |
| 2.2.4.8 | Validate email (gõ email sai → báo lỗi đỏ) | ☐ | ☐ | |
| 2.2.4.9 | Validate số điện thoại (gõ chữ → báo lỗi) | ☐ | ☐ | |
| 2.2.4.10 | Click "Xác nhận đặt lịch" → hiển thị thông báo "Đặt lịch thành công" | ☐ | ☐ | |
| 2.2.4.11 | Sau khi đặt thành công → redirect về trang chủ hoặc trang cảm ơn | ☐ | ☐ | |

#### Bước 2.2.5: Test quay lại
1. Từ bước 3, click "Quay lại"
2. Kiểm tra:
   - Quay về bước 2
   - Luật sư đã chọn vẫn highlight
3. Click "Quay lại" lần nữa
4. Kiểm tra:
   - Quay về bước 1
   - Dịch vụ đã chọn vẫn highlight

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 2.2.5.1 | Nút "Quay lại" hoạt động đúng | ☐ | ☐ | |
| 2.2.5.2 | Lựa chọn cũ được giữ nguyên khi quay lại | ☐ | ☐ | |

---

### BƯỚC 2.3: Test trên điện thoại (Responsive)

1. Mở trang `https://vpluat.vn/booking` trên điện thoại
2. Hoặc dùng Chrome DevTools:
   - Nhấn F12
   - Click icon 📱 "Toggle device toolbar" (góc trái trên)
   - Chọn iPhone hoặc Pixel

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 2.3.1 | Trang chủ hiển thị đẹp trên mobile (chữ không bị nhỏ) | ☐ | ☐ | |
| 2.3.2 | Menu có nút hamburger ☰ (3 gạch ngang) | ☐ | ☐ | |
| 2.3.3 | Click hamburger → menu mở ra với các link | ☐ | ☐ | |
| 2.3.4 | Trang booking hiển thị các nút dịch vụ theo dạng lưới 1-2 cột | ☐ | ☐ | |
| 2.3.5 | Có thể cuộn dọc dễ dàng | ☐ | ☐ | |
| 2.3.6 | Calendar trên bước 3 hiển thị đúng | ☐ | ☐ | |

---

### BƯỚC 2.4: Test các trang public khác

| # | Trang | Đường dẫn | Kiểm tra | Đạt | Lỗi |
|---|-------|-----------|----------|-----|-----|
| 2.4.1 | Trang dịch vụ | `/dich-vu` | Hiển thị danh sách 14 dịch vụ | ☐ | ☐ |
| 2.4.2 | Trang luật sư | `/luat-su` | Hiển thị profile luật sư | ☐ | ☐ |
| 2.4.3 | Trang blog | `/blog` hoặc `/tin-tuc` | Hiển thị danh sách bài viết | ☐ | ☐ |
| 2.4.4 | Chi tiết bài viết | Click vào 1 bài | Hiển thị nội dung đầy đủ | ☐ | ☐ |
| 2.4.5 | Trang liên hệ | `/lien-he` | Form liên hệ hiển thị | ☐ | ☐ |
| 2.4.6 | Trang FAQ | `/cau-hoi-thuong-gap` | Danh sách câu hỏi | ☐ | ☐ |
| 2.4.7 | Trang giới thiệu | `/gioi-thieu` | Thông tin công ty | ☐ | ☐ |
| 2.4.8 | Click chatbot | Nút chat góc phải | Hộp thoại chatbot mở | ☐ | ☐ |

**Test chatbot nhanh:**
1. Click biểu tượng chat góc phải màn hình
2. Gõ: "Tôi muốn tư vấn"
3. Kiểm tra có phản hồi từ bot

| # | Mục | Đạt | Lỗi |
|---|-----|-----|-----|
| 2.4.9 | Chatbot mở được | ☐ | ☐ |
| 2.4.10 | Có thể gõ tin nhắn | ☐ | ☐ |
| 2.4.11 | Bot phản hồi | ☐ | ☐ |

---

## PHẦN 3: ĐĂNG NHẬP TRANG QUẢN TRỊ

> ⏱️ Thời gian: ~5 phút

---

### BƯỚC 3.1: Truy cập trang admin

1. Mở trình duyệt, truy cập `https://admin.vpluat.vn`
2. Nếu chưa đăng nhập sẽ tự redirect về trang login

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 3.1.1 | Trang login hiển thị | ☐ | ☐ | |
| 3.1.2 | Có ô Email và ô Mật khẩu | ☐ | ☐ | |
| 3.1.3 | Có nút "Đăng nhập" | ☐ | ☐ | |

---

### BƯỚC 3.2: Đăng nhập

**Test đăng nhập thành công:**
1. Email: `admin@vpluat.vn`
2. Mật khẩu: (sẽ được cấp)
3. Click "Đăng nhập"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 3.2.1 | Đăng nhập thành công, chuyển sang dashboard | ☐ | ☐ | |
| 3.2.2 | Sidebar hiển thị các menu quản trị | ☐ | ☐ | |
| 3.2.3 | Tên user hiển thị ở góc trên phải | ☐ | ☐ | |
| 3.2.4 | Có menu xổ xuống để đăng xuất | ☐ | ☐ | |

**Test đăng nhập sai:**
1. Nhập email sai: `wrong@vpluat.vn`
2. Mật khẩu bất kỳ
3. Click "Đăng nhập"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 3.2.5 | Hiển thị thông báo lỗi "Email hoặc mật khẩu không đúng" | ☐ | ☐ | |
| 3.2.6 | Không chuyển trang | ☐ | ☐ | |

**Test đăng xuất:**
1. Click vào tên user góc trên phải
2. Click "Đăng xuất"
3. Kiểm tra redirect về trang login

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 3.2.7 | Click tên user → menu xổ xuống | ☐ | ☐ | |
| 3.2.8 | Click "Đăng xuất" → về trang login | ☐ | ☐ | |

---

### BƯỚC 3.3: Test với các role khác nhau

> Test rằng user chỉ thấy các menu theo quyền của mình.

**Đăng nhập bằng từng role và kiểm tra sidebar:**

| Role | Email | Các menu nên thấy | Đạt | Lỗi |
|------|-------|-------------------|-----|-----|
| **Super Admin** | super.admin@vpluat.vn | Thấy TẤT CẢ menu (~16 mục) | ☐ | ☐ |
| **Admin** | admin@vpluat.vn | Thấy hầu hết (trừ Settings nâng cao) | ☐ | ☐ |
| **Editor** | editor@vpluat.vn | Thấy Blog, Case Studies (KHÔNG thấy Users, Settings) | ☐ | ☐ |
| **CSKH** | cskh@vpluat.vn | Thấy CRM, Bookings, Reviews (KHÔNG thấy Blog, Users) | ☐ | ☐ |
| **Luật sư** | hung@vpluat.vn | Chỉ thấy Bookings, Hồ sơ cá nhân | ☐ | ☐ |
| **Viewer** | viewer@vpluat.vn | Chỉ xem, không sửa/xóa | ☐ | ☐ |

---

## PHẦN 4: TEST CÁC CHỨC NĂNG QUẢN TRỊ

> ⏱️ Thời gian: ~2-3 giờ
> Đăng nhập với **Admin** (`admin@vpluat.vn`) cho phần này.

---

### BƯỚC 4.1: Dashboard (Bảng điều khiển)

**Đường dẫn:** `/admin/dashboard`

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.1.1 | Trang dashboard load không lỗi | ☐ | ☐ | |
| 4.1.2 | Hiển thị 4-6 thẻ thống kê (Lịch hẹn hôm nay, Lead tuần này, Tỷ lệ chuyển đổi...) | ☐ | ☐ | |
| 4.1.3 | Có biểu đồ đường/biểu đồ tròn | ☐ | ☐ | |
| 4.1.4 | Số liệu hiển thị đúng (không phải 0 hoặc NaN) | ☐ | ☐ | |
| 4.1.5 | Có danh sách hoạt động gần đây | ☐ | ☐ | |

---

### BƯỚC 4.2: Quản lý Lead (CRM) - QUAN TRỌNG

**Đường dẫn:** `/admin/crm`

#### Test hiển thị:

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.2.1 | Trang CRM load, không lỗi | ☐ | ☐ | |
| 4.2.2 | Có 5 tab trạng thái: Tất cả, Mới, Đã liên hệ, Đang xử lý, Đã chuyển đổi, Mất lead | ☐ | ☐ | |
| 4.2.3 | Mỗi tab hiển thị số lượng (badge) | ☐ | ☐ | |
| 4.2.4 | Bảng danh sách lead hiển thị với cột: Tên, SĐT, Email, Dịch vụ, Nguồn, Trạng thái | ☐ | ☐ | |
| 4.2.5 | Có nút "Thêm mới" | ☐ | ☐ | |

#### Test tạo Lead mới:

1. Click nút **"Thêm mới"** (góc trên phải)
2. Điền form:
   - Họ tên: `Lead Test Auto`
   - Email: `leadtest@vpluat.vn`
   - Số điện thoại: `0901234567`
   - Dịch vụ: chọn "Doanh Nghiệp"
   - Nguồn: chọn "Facebook"
   - Ghi chú: `Test từ QA`
3. Click **"Lưu"**

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.2.6 | Form thêm mới mở ra | ☐ | ☐ | |
| 4.2.7 | Tất cả các trường hiển thị | ☐ | ☐ | |
| 4.2.8 | Click "Lưu" → đóng form | ☐ | ☐ | |
| 4.2.9 | Lead mới xuất hiện trong danh sách | ☐ | ☐ | |
| 4.2.10 | Hiển thị thông báo "Tạo thành công" (toast màu xanh) | ☐ | ☐ | |

#### Test chỉnh sửa Lead:

1. Tìm lead "Nguyễn Văn An" trong danh sách
2. Click vào biểu tượng ✏️ **Sửa** (hoặc click vào tên lead)
3. Sửa ghi chú thành: `Đã cập nhật test lúc [giờ hiện tại]`
4. Click "Lưu"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.2.11 | Form sửa mở ra với dữ liệu cũ | ☐ | ☐ | |
| 4.2.12 | Sau khi lưu → thông báo "Cập nhật thành công" | ☐ | ☐ | |
| 4.2.13 | Ghi chú mới hiển thị trong danh sách | ☐ | ☐ | |

#### Test xem chi tiết Lead (Drawer):

1. Click vào tên một lead bất kỳ
2. Drawer (bảng trượt từ phải) mở ra

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.2.14 | Drawer mở ra từ phải | ☐ | ☐ | |
| 4.2.15 | Hiển thị thông tin liên hệ (email, SĐT) | ☐ | ☐ | |
| 4.2.16 | Có 3 tab: Hoạt động, Ghi chú, Lịch hẹn | ☐ | ☐ | |
| 4.2.17 | Tab "Ghi chú" có ô để nhập note mới | ☐ | ☐ | |
| 4.2.18 | Gõ note + click gửi → note xuất hiện trong danh sách | ☐ | ☐ | |
| 4.2.19 | Đóng drawer bằng nút X | ☐ | ☐ | |

#### Test Bulk actions (hành động hàng loạt):

1. Tick chọn 3-5 lead (click vào checkbox đầu mỗi dòng)
2. Thanh bulk action xuất hiện ở trên cùng

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.2.20 | Tick chọn lead → checkbox đổi màu | ☐ | ☐ | |
| 4.2.21 | Thanh bulk action hiển thị "X đã chọn" | ☐ | ☐ | |
| 4.2.22 | Có nút "Đổi trạng thái" | ☐ | ☐ | |
| 4.2.23 | Có nút "Gán luật sư" | ☐ | ☐ | |
| 4.2.24 | Có nút "Xóa" | ☐ | ☐ | |
| 4.2.25 | Click "Gán luật sư" → chọn LS Hùng → OK | ☐ | ☐ | |
| 4.2.26 | Thông báo "Đã gán thành công N lead" | ☐ | ☐ | |
| 4.2.27 | Trạng thái các lead đã chọn cập nhật | ☐ | ☐ | |

#### Test xóa Lead:

1. Tick chọn 1 lead test vừa tạo
2. Click "Xóa"
3. Xác nhận trong modal
4. Click "Xóa" lần nữa

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.2.28 | Modal xác nhận hiển thị | ☐ | ☐ | |
| 4.2.29 | Click "Xóa" → lead biến mất khỏi danh sách | ☐ | ☐ | |
| 4.2.30 | Thông báo "Đã xóa thành công" | ☐ | ☐ | |

---

### BƯỚC 4.3: Quản lý Blog

**Đường dẫn:** `/admin/blog`

> Gợi ý: Đăng nhập với **Editor** (`editor@vpluat.vn`) để test.

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.3.1 | Trang blog load | ☐ | ☐ | |
| 4.3.2 | Danh sách bài viết hiển thị | ☐ | ☐ | |
| 4.3.3 | Có badge trạng thái: "Đã xuất bản", "Bản nháp", "Lưu trữ" | ☐ | ☐ | |
| 4.3.4 | Click "Viết bài mới" → mở editor | ☐ | ☐ | |
| 4.3.5 | Editor cho phép nhập tiêu đề | ☐ | ☐ | |
| 4.3.6 | Editor có thanh công cụ (bold, italic, heading, link) | ☐ | ☐ | |
| 4.3.7 | Có thể chọn danh mục, tags | ☐ | ☐ | |
| 4.3.8 | Click "Lưu nháp" → thông báo thành công | ☐ | ☐ | |
| 4.3.9 | Click "Xuất bản" → bài có trạng thái Published | ☐ | ☐ | |

**Test bulk actions trên Blog:**

1. Tick chọn 3 bài viết
2. Click "Xuất bản hàng loạt"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.3.10 | Thanh bulk hiển thị "3 đã chọn" | ☐ | ☐ | |
| 4.3.11 | Click "Xuất bản" → thông báo "Đã xuất bản 3 bài" | ☐ | ☐ | |
| 4.3.12 | Trạng thái các bài đã chọn đổi thành "Đã xuất bản" | ☐ | ☐ | |
| 4.3.13 | Click "Xóa" → modal xác nhận | ☐ | ☐ | |
| 4.3.14 | Xác nhận xóa → bài biến mất | ☐ | ☐ | |

---

### BƯỚC 4.4: Quản lý Lịch hẹn (Bookings)

**Đường dẫn:** `/admin/bookings`

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.4.1 | Trang bookings load | ☐ | ☐ | |
| 4.4.2 | Danh sách lịch hẹn hiển thị | ☐ | ☐ | |
| 4.4.3 | Lọc theo trạng thái (Chờ xác nhận, Đã xác nhận, Hoàn thành, Đã hủy) | ☐ | ☐ | |
| 4.4.4 | Click vào lịch hẹn → mở chi tiết | ☐ | ☐ | |
| 4.4.5 | Click "Xác nhận" → trạng thái đổi sang CONFIRMED | ☐ | ☐ | |
| 4.4.6 | Click "Hủy" → trạng thái đổi sang CANCELLED | ☐ | ☐ | |

---

### BƯỚC 4.5: Quản lý Người dùng & Phân quyền

**Đường dẫn:** `/admin/users`

> Phải đăng nhập với **Admin** trở lên.

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.5.1 | Trang users load | ☐ | ☐ | |
| 4.5.2 | Thấy các tab: Người dùng, Vai trò, Permission Matrix, Audit log | ☐ | ☐ | |
| 4.5.3 | Bảng danh sách user hiển thị | ☐ | ☐ | |
| 4.5.4 | Có badge màu cho từng vai trò | ☐ | ☐ | |

**Test xem User Activity:**

1. Tìm 1 user trong danh sách (ví dụ: "Trần Thị Admin")
2. Click vào biểu tượng 📊 **Activity** (hoặc biểu tượng đồ thị)
3. Drawer lịch sử hoạt động mở ra

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.5.5 | Drawer activity mở ra | ☐ | ☐ | |
| 4.5.6 | Hiển thị thông tin user (email, vai trò, trạng thái) | ☐ | ☐ | |
| 4.5.7 | Hiển thị danh sách hoạt động với thời gian | ☐ | ☐ | |
| 4.5.8 | Mỗi hoạt động có icon và màu tương ứng | ☐ | ☐ | |
| 4.5.9 | Click "Tải thêm" → load thêm hoạt động cũ | ☐ | ☐ | |

**Test Impersonate (đăng nhập hộ):**

1. Tìm 1 user (KHÔNG phải Super Admin)
2. Click vào biểu tượng 👤 **Đăng nhập thay** (icon người + mũi tên)
3. Xác nhận trong modal

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.5.10 | Modal xác nhận hiển thị | ☐ | ☐ | |
| 4.5.11 | Thông báo cảnh báo "Hành động này sẽ được ghi audit" | ☐ | ☐ | |
| 4.5.12 | Sau khi xác nhận → banner vàng "Đang đăng nhập thay..." hiển thị | ☐ | ☐ | |
| 4.5.13 | Có nút "Thoát impersonate" ở header | ☐ | ☐ | |
| 4.5.14 | Click "Thoát" → quay lại user ban đầu | ☐ | ☐ | |

---

### BƯỚC 4.6: Roles & Permissions Matrix

**Đường dẫn:** `/admin/roles`

> Chỉ Super Admin mới thấy menu này.

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.6.1 | Trang roles load | ☐ | ☐ | |
| 4.6.2 | Hiển thị các role card: SUPER_ADMIN, ADMIN, STAFF, LAWYER, CLIENT | ☐ | ☐ | |
| 4.6.3 | Mỗi card có số lượng permissions và progress bar | ☐ | ☐ | |
| 4.6.4 | Bảng matrix hiển thị: Cột là các role, hàng là các permission | ☐ | ☐ | |
| 4.6.5 | Có nhóm permission: CRM, Booking, Blog, Services, Reviews... | ☐ | ☐ | |
| 4.6.6 | Các ô có dấu ✓ (xanh) nếu có quyền, ✗ (xám) nếu không | ☐ | ☐ | |
| 4.6.7 | Click vào role card → highlight cột đó trong matrix | ☐ | ☐ | |
| 4.6.8 | Panel chi tiết role hiển thị bên dưới | ☐ | ☐ | |

---

### BƯỚC 4.7: Quản lý File

**Đường dẫn:** `/admin/files`

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.7.1 | Trang files load | ☐ | ☐ | |
| 4.7.2 | Có vùng "Kéo thả file hoặc click để chọn" | ☐ | ☐ | |
| 4.7.3 | Có dropdown chọn folder (Images, Documents, Blog...) | ☐ | ☐ | |
| 4.7.4 | Có nút chuyển Grid/List view | ☐ | ☐ | |

**Test upload file:**

1. Chuẩn bị 1 file ảnh (.jpg hoặc .png) nhỏ hơn 10MB
2. Click vào vùng upload → chọn file
3. Đợi upload

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.7.5 | Click upload → mở dialog chọn file | ☐ | ☐ | |
| 4.7.6 | File upload thành công | ☐ | ☐ | |
| 4.7.7 | Thông báo "Đã tải lên: [tên file]" | ☐ | ☐ | |
| 4.7.8 | File xuất hiện trong danh sách dạng grid (có ảnh preview) | ☐ | ☐ | |
| 4.7.9 | Click nút "Copy" → URL copy vào clipboard | ☐ | ☐ | |
| 4.7.10 | Click nút "Xóa" → modal xác nhận | ☐ | ☐ | |
| 4.7.11 | Xác nhận xóa → file biến mất | ☐ | ☐ | |

**Test upload file quá dung lượng:**

1. Thử upload file > 10MB
2. Kiểm tra thông báo lỗi

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.7.12 | Upload file lớn bị từ chối | ☐ | ☐ | |
| 4.7.13 | Thông báo "File quá lớn" hiển thị | ☐ | ☐ | |

---

### BƯỚC 4.8: Lịch làm việc Luật sư (Calendar)

**Đường dẫn:** `/admin/lawyer-schedules`

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.8.1 | Trang calendar load | ☐ | ☐ | |
| 4.8.2 | Hiển thị lịch tuần (T2-CN) | ☐ | ☐ | |
| 4.8.3 | Mỗi luật sư là 1 hàng | ☐ | ☐ | |
| 4.8.4 | Ô có khung giờ làm việc hiển thị (màu xanh) | ☐ | ☐ | |
| 4.8.5 | Có nút ◀ ▶ để chuyển tuần | ☐ | ☐ | |
| 4.8.6 | Click "Hôm nay" → về tuần hiện tại | ☐ | ☐ | |

**Test tạo Override (đăng ký nghỉ):**

1. Click vào nút "+ Override" trong 1 ô trống
2. Modal mở ra
3. Chọn "Nghỉ"
4. Nhập lý do: `Nghỉ phép test`
5. Click "Xác nhận"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.8.7 | Modal override mở ra | ☐ | ☐ | |
| 4.8.8 | Chọn "Nghỉ" → highlight | ☐ | ☐ | |
| 4.8.9 | Click "Xác nhận" → đóng modal | ☐ | ☐ | |
| 4.8.10 | Ô đó hiển thị "Nghỉ - [lý do]" màu đỏ | ☐ | ☐ | |
| 4.8.11 | Có nút "Xóa" override | ☐ | ☐ | |

---

### BƯỚC 4.9: Cài đặt (Settings)

**Đường dẫn:** `/admin/settings`

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.9.1 | Trang settings load | ☐ | ☐ | |
| 4.9.2 | Có các tab: Chung, Booking, SMTP, Test Email, Theme, Tích hợp | ☐ | ☐ | |

**Test Email Test Panel:**

1. Click tab "Test Email"
2. Nhập email nhận: `test@vpluat.vn`
3. Click "Gửi Email Test"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.9.3 | Email Test Panel hiển thị | ☐ | ☐ | |
| 4.9.4 | Hiển thị thông tin SMTP (host, port, from) | ☐ | ☐ | |
| 4.9.5 | Có 3 loại email: Cơ bản, Xác nhận lịch, Nhắc lịch | ☐ | ☐ | |
| 4.9.6 | Nhập email + click gửi → loading | ☐ | ☐ | |
| 4.9.7 | Thông báo kết quả (thành công/thất bại) hiển thị | ☐ | ☐ | |

**Test SMTP settings:**

1. Click tab "SMTP"
2. Điền các trường: Host, Port, Username, Password
3. Click "Lưu"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.9.8 | Form SMTP hiển thị đầy đủ trường | ☐ | ☐ | |
| 4.9.9 | Click "Lưu" → thông báo "Đã lưu SMTP" | ☐ | ☐ | |

---

### BƯỚC 4.10: Quản lý Nội dung Site

**Đường dẫn:** `/admin/site-content`

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.10.1 | Trang load | ☐ | ☐ | |
| 4.10.2 | Có 4 tab: Hero Banner, Giới thiệu, Liên hệ, Mạng xã hội | ☐ | ☐ | |
| 4.10.3 | Hiển thị ngôn ngữ: Tiếng Việt / English | ☐ | ☐ | |

**Test Preview:**

1. Click nút "Xem trước" (góc trên phải)

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.10.4 | Modal preview mở ra | ☐ | ☐ | |
| 4.10.5 | Preview hiển thị giống trang public | ☐ | ☐ | |
| 4.10.6 | Hero banner với title và CTA button | ☐ | ☐ | |
| 4.10.7 | Phần about với mission, vision | ☐ | ☐ | |
| 4.10.8 | Phần contact với địa chỉ, SĐT, email | ☐ | ☐ | |
| 4.10.9 | Đóng preview bằng nút "Đóng" | ☐ | ☐ | |

**Test Edit & Save:**

1. Click "Chỉnh sửa"
2. Sửa tiêu đề Hero
3. Click "Lưu"

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.10.10 | Click "Chỉnh sửa" → các trường enabled | ☐ | ☐ | |
| 4.10.11 | Sửa xong click "Lưu" → thông báo "Đã lưu" | ☐ | ☐ | |

---

### BƯỚC 4.11: Các trang khác (test nhanh)

| # | Trang | Đường dẫn | Kiểm tra | Đạt | Lỗi |
|---|-------|-----------|----------|-----|-----|
| 4.11.1 | Case Studies | `/admin/case-studies` | Load + danh sách | ☐ | ☐ |
| 4.11.2 | Services & Lawyers | `/admin/services-management` | Load + quản lý | ☐ | ☐ |
| 4.11.3 | Reviews | `/admin/reviews` | Danh sách review | ☐ | ☐ |
| 4.11.4 | Chatbot | `/admin/chatbot` | Lịch sử chat | ☐ | ☐ |
| 4.11.5 | Newsletter | `/admin/newsletter` | Subscribers/Campaigns | ☐ | ☐ |
| 4.11.6 | Landing Pages | `/admin/landing-pages` | Danh sách landing page | ☐ | ☐ |
| 4.11.7 | Jobs | `/admin/jobs` | Tin tuyển dụng | ☐ | ☐ |
| 4.11.8 | Reports | `/admin/reports` | Báo cáo thống kê | ☐ | ☐ |
| 4.11.9 | Notifications | `/admin/notifications` | Thông báo | ☐ | ☐ |
| 4.11.10 | Audit log | `/admin/audit` | Nhật ký thao tác | ☐ | ☐ |

---

### BƯỚC 4.12: Test ngôn ngữ

1. Click chuyển ngôn ngữ EN ↔ VI (thường ở header)

| # | Mục cần kiểm tra | Đạt | Lỗi | Ghi chú |
|---|------------------|-----|-----|---------|
| 4.12.1 | Có nút chuyển ngôn ngữ | ☐ | ☐ | |
| 4.12.2 | Click EN → toàn bộ UI chuyển sang tiếng Anh | ☐ | ☐ | |
| 4.12.3 | Click VI → quay lại tiếng Việt | ☐ | ☐ | |

---

## PHẦN 5: BÁO LỖI

### Cách báo lỗi

Khi phát hiện lỗi, ghi lại thông tin sau:

#### Mẫu báo lỗi:

```
📌 MÃ LỖI: [Đánh số thứ tự, ví dụ: ERR-001]
📅 NGÀY PHÁT HIỆN: [Ngày giờ hiện tại]
👤 NGƯỜI TEST: [Tên của bạn]
🌐 URL: [Đường dẫn trang bị lỗi]
📱 THIẾT BỊ: [Chrome/Firefox/Edge - Windows/Mac/iPhone/Android]
🔢 BƯỚC: [Bước xảy ra lỗi, ví dụ: 4.2.8]

📝 MÔ TẢ:
- Mô tả chi tiết điều xảy ra
- Mong đợi điều gì
- Thực tế xảy ra điều gì

📸 ẢNH CHỤP MÀN HÌNH: [Đính kèm nếu có]

📊 MỨC ĐỘ NGHIÊM TRỌNG:
- [ ] Cao: Chức năng chính không hoạt động
- [ ] Trung bình: Hoạt động nhưng có lỗi nhỏ
- [ ] Thấp: Lỗi giao diện không ảnh hưởng chức năng
```

### Ví dụ báo lỗi:

```
📌 MÃ LỖI: ERR-001
📅 NGÀY PHÁT HIỆN: 19/09/2026 14:30
👤 NGƯỜI TEST: Nguyễn Văn A
🌐 URL: https://vpluat.vn/booking
📱 THIẾT BỊ: Chrome 118 - Windows 11
🔢 BƯỚC: 2.2.3 - Chọn luật sư

📝 MÔ TẢ:
- Sau khi click vào dịch vụ "Doanh Nghiệp", danh sách luật sư load chậm (~10 giây)
- Mong đợi: Load trong vòng 2-3 giây
- Thực tế: Mất 10 giây mới hiển thị

📸 ẢNH: [đính kèm screenshot]

📊 MỨC ĐỘ: Trung bình
```

---

## PHẦN 6: PHIẾU TEST NHANH

> In phiếu này ra giấy và đánh dấu trực tiếp khi test.

### Phiếu 1: Booking Flow (Trang đặt lịch)
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load trang booking | ☐ | ☐ | |
| 2 | Chọn dịch vụ "Doanh Nghiệp" | ☐ | ☐ | |
| 3 | Nút "Tiếp theo" enabled | ☐ | ☐ | |
| 4 | Hiển thị danh sách luật sư | ☐ | ☐ | |
| 5 | Chọn LS Hùng | ☐ | ☐ | |
| 6 | Chuyển sang bước chọn ngày | ☐ | ☐ | |
| 7 | Chọn ngày + giờ | ☐ | ☐ | |
| 8 | Điền form thông tin | ☐ | ☐ | |
| 9 | Submit thành công | ☐ | ☐ | |
| 10 | Nhận email xác nhận | ☐ | ☐ | |

### Phiếu 2: CRM (Lead)
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load trang CRM | ☐ | ☐ | |
| 2 | Tạo lead mới | ☐ | ☐ | |
| 3 | Sửa lead | ☐ | ☐ | |
| 4 | Xem chi tiết lead (drawer) | ☐ | ☐ | |
| 5 | Thêm ghi chú vào lead | ☐ | ☐ | |
| 6 | Bulk gán luật sư (3 leads) | ☐ | ☐ | |
| 7 | Bulk xóa (sau khi đã tạo test) | ☐ | ☐ | |
| 8 | Lọc theo trạng thái | ☐ | ☐ | |
| 9 | Tìm kiếm theo tên | ☐ | ☐ | |

### Phiếu 3: Blog
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load trang blog | ☐ | ☐ | |
| 2 | Tạo bài viết mới | ☐ | ☐ | |
| 3 | Lưu nháp | ☐ | ☐ | |
| 4 | Xuất bản bài viết | ☐ | ☐ | |
| 5 | Sửa bài viết | ☐ | ☐ | |
| 6 | Xóa bài viết | ☐ | ☐ | |
| 7 | Bulk xuất bản | ☐ | ☐ | |
| 8 | Bulk xóa | ☐ | ☐ | |

### Phiếu 4: Users & Permissions
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load trang users | ☐ | ☐ | |
| 2 | Tạo user mới | ☐ | ☐ | |
| 3 | Sửa user | ☐ | ☐ | |
| 4 | Xem activity drawer | ☐ | ☐ | |
| 5 | Reset password | ☐ | ☐ | |
| 6 | Impersonate user | ☐ | ☐ | |
| 7 | Thoát impersonate | ☐ | ☐ | |
| 8 | Test role permissions (Editor không thấy menu Users) | ☐ | ☐ | |

### Phiếu 5: Files Manager
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load trang files | ☐ | ☐ | |
| 2 | Upload ảnh thành công | ☐ | ☐ | |
| 3 | Upload file lớn (>10MB) bị từ chối | ☐ | ☐ | |
| 4 | Chuyển grid/list view | ☐ | ☐ | |
| 5 | Copy URL | ☐ | ☐ | |
| 6 | Xóa file | ☐ | ☐ | |

### Phiếu 6: Lawyer Schedules
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load calendar | ☐ | ☐ | |
| 2 | Chuyển tuần | ☐ | ☐ | |
| 3 | Lọc theo luật sư | ☐ | ☐ | |
| 4 | Tạo override nghỉ | ☐ | ☐ | |
| 5 | Xóa override | ☐ | ☐ | |

### Phiếu 7: Settings
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load trang settings | ☐ | ☐ | |
| 2 | Tab Chung | ☐ | ☐ | |
| 3 | Tab SMTP | ☐ | ☐ | |
| 4 | Tab Test Email | ☐ | ☐ | |
| 5 | Gửi email test thành công | ☐ | ☐ | |
| 6 | Tab Theme | ☐ | ☐ | |

### Phiếu 8: Site Content
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Load trang | ☐ | ☐ | |
| 2 | Tab Hero | ☐ | ☐ | |
| 3 | Tab About | ☐ | ☐ | |
| 4 | Tab Contact | ☐ | ☐ | |
| 5 | Tab Social | ☐ | ☐ | |
| 6 | Preview modal | ☐ | ☐ | |
| 7 | Chuyển ngôn ngữ VI/EN | ☐ | ☐ | |

### Phiếu 9: Public Pages
| # | Mục test | Đạt | Lỗi | Mã lỗi |
|---|----------|-----|-----|--------|
| 1 | Trang chủ | ☐ | ☐ | |
| 2 | Trang dịch vụ | ☐ | ☐ | |
| 3 | Trang luật sư | ☐ | ☐ | |
| 4 | Trang blog public | ☐ | ☐ | |
| 5 | Chi tiết bài viết | ☐ | ☐ | |
| 6 | Trang liên hệ | ☐ | ☐ | |
| 7 | Trang FAQ | ☐ | ☐ | |
| 8 | Chatbot hoạt động | ☐ | ☐ | |
| 9 | Mobile responsive | ☐ | ☐ | |

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề trong quá trình test:

- **Email hỗ trợ**: dev@vpluat.vn
- **Hotline**: 0901 xxx xxx
- **Giờ hỗ trợ**: 8:00 - 17:00 (T2 - T7)

Khi gửi báo lỗi, vui lòng kèm theo:
1. Mã lỗi (ERR-XXX)
2. Ảnh chụp màn hình
3. URL trang bị lỗi
4. Mô tả các bước tái hiện lỗi

---

**Phiên bản**: 1.0  
**Ngày cập nhật**: 19/09/2026  
**Dành cho khách hàng** - Không yêu cầu kiến thức lập trình
