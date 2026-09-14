# Hướng giải quyết — SGOS Assessment 01

Tài liệu này giải thích lý do đằng sau các quyết định product/technical của
prototype, viết riêng cho reviewer (tiếng Việt). Chi tiết setup/kỹ thuật xem
`README.md`.

## Target user

Chọn **self-learner** (người học online tự do — bootcamp, MOOC, tự học) thay
vì sinh viên đại học chính quy, vì đây là nhóm khó xác định "mình đang ở
đâu" nhất: không có mentor/advisor, không có curriculum cố định, học rải rác
nhiều nguồn. Nhóm này hưởng lợi rõ nhất từ một công cụ reflection nhanh.

## Problem

Self-learner thường không dừng lại để tự đánh giá tiến độ — không ai hỏi
"bạn đang ổn không, cái gì đang work, cái gì không". Prototype giải quyết
đúng khoảng trống đó: cho input về goal/activity/strength/challenge, AI trả
lại một bức tranh có cấu trúc để họ tự nhìn lại và biết bước tiếp theo.

## MVP scope — làm gì, bỏ gì

**Làm:** 1 form 5 field → AI trả 4 section cố định (Overview/Observations/
Actions/Plan) → xử lý lỗi cơ bản (input rỗng, AI lỗi, AI trả sai format).

**Cố tình bỏ:** auth/login, lưu lịch sử nhiều lần submit, multi-user,
edit/regenerate output, analytics. Lý do: đây là bài test đánh giá
problem-solving + architecture trong 3-4h, không phải một sản phẩm hoàn
chỉnh — thêm các phần này chỉ pha loãng thời gian dành cho phần AI
Integration (25% điểm) và Architecture (20% điểm), 2 mục weight cao nhất.

## Vì sao chọn Next.js full-stack

1 repo, frontend + backend (API route) trong cùng 1 app — không cần dựng 2
service riêng cho 1 endpoint duy nhất. Phù hợp scope 3-4h, deploy 1 lệnh lên
Vercel nếu kịp làm demo.

## Vì sao structured output + validate 2 lớp

- **Lớp 1**: ép AI trả JSON qua `response_format: json_object` + prompt định
  nghĩa rõ contract 4 field.
- **Lớp 2**: dù AI trả HTTP 200, vẫn Zod-validate lại response trước khi
  cho ra UI — vì "gọi API thành công" không đồng nghĩa "output đúng format".
  Đây chính là điểm khác biệt giữa prototype nghiệp dư và prototype có suy
  nghĩ về reliability.

Input từ user cũng Zod-validate tương tự ở backend — không tin tưởng dữ
liệu chỉ vì đã validate ở frontend.

## Xử lý lỗi

4 case theo yêu cầu đề bài, mỗi case một hướng xử lý khác nhau có chủ đích:

| Case | Xử lý | Vì sao |
|---|---|---|
| Input rỗng/invalid | 400, chặn cả ở frontend lẫn backend | Fail sớm, tiết kiệm 1 lượt gọi AI tốn tiền/thời gian |
| AI API lỗi (network/5xx) | Retry 1 lần → vẫn fail → 502 | Lỗi tạm thời (transient) đáng thử lại, nhưng không retry vô hạn |
| AI trả sai schema | Không retry, 422 luôn | Đây là lỗi prompt/parsing, retry không tự sửa được, retry vô ích |
| Lỗi không lường trước | try/catch bọc ngoài → 500 generic | Không để lộ lỗi kỹ thuật thô ra UI |

## Success criteria

Prototype coi là "hữu ích" nếu: (1) user nhập 5 field xong nhận output có
cấu trúc, đọc hiểu ngay không cần suy diễn; (2) mỗi observation/action bám
sát nội dung user nhập (không phải lời khuyên chung chung kiểu horoscope);
(3) không crash hay hiện lỗi kỹ thuật thô khi input rỗng hoặc AI service
gặp sự cố.

## Trade-off có ý thức

Không làm prompt versioning/eval tự động trong bản đầu tiên (3-4h) — lý do:
với scope 1 prompt, 1 use case, effort này chưa tạo ra giá trị tương xứng
thời gian bỏ ra. Sau đó đã mở rộng thêm (xem mục dưới) vì có giá trị thật và
thời gian cho phép.

## Mở rộng sau bản đầu (Postgres + Docker + prompt versioning + history)

Sau bản MVP 3-4h, mở rộng thêm 4 việc, đều có lý do cụ thể chứ không phải
"làm cho đủ":

- **Postgres + Prisma**: evaluation history và prompt version cần query
  thật (list, tìm theo id, tìm "prompt đang active") — file phẳng không đáp
  ứng được, cần store quan hệ.
- **Prompt versioning trong DB** (không phải code): mỗi `Evaluation` gắn
  với `promptVersionId` cụ thể — sau này debug "tại sao AI trả lời như
  vậy" luôn biết chính xác prompt nào sinh ra output đó, và đổi prompt
  không cần deploy lại.
- **`RequestLog` tách riêng `Evaluation`**: log kỹ thuật (status code,
  latency, lỗi) ghi ở MỌI request kể cả request fail ngay từ bước validate
  input — nếu gộp chung với evaluation, history của user sẽ lẫn cả những
  lần submit lỗi chưa từng ra được kết quả.
- **Docker Compose (app + Postgres)**: 1 lệnh `npm run docker:up` là chạy
  được toàn bộ, không cần cài Postgres thủ công trên máy reviewer.

UI cũng đổi từ layout 2 cột tĩnh (form bên trái, kết quả bên phải) sang
single-flow: submit xong kết quả hiện ngay dưới form, kèm danh sách lịch sử
bên dưới — click vào 1 lần cũ sẽ thấy lại đúng input đã nhập ra kết quả đó.
