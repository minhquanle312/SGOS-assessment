# Student Development Assistant (SGOS Assessment 01)

Mini AI-powered Student Development Assistant. Làm cho SGOS Product
Engineer Assessment, Test 1 (Product & AI Prototype).

## 1. Product overview

Single-page app, self-learner (bootcamp/online course) nhập learning
goal, current activities, strengths, challenges, short-term goal, nhận
lại 1 plan có cấu trúc do AI sinh ra (overview, observations, suggested
actions, next steps). Mỗi lần submit được lưu lại, hiện trong history
list để xem lại input nào ra kết quả nào.

## 2. Problem và target user

Self-learner học rải rác nhiều nguồn, không có mentor/advisor, khó dừng
lại tự hỏi mình đang ở đâu, cái gì work, bước tiếp theo nên làm gì.
Prototype cho họ điểm dừng đó bất cứ lúc nào.

Target user: self-learner ngoài mô hình institutional (bootcamp student,
MOOC learner, self-taught dev), có short-term goal rõ nhưng không có
feedback loop sẵn có.

## 3. MVP scope

**Làm:** form 5 field, AI trả 4 section cố định (Overview/Observations/
Actions/Plan), xử lý lỗi cơ bản (input rỗng, AI lỗi, AI trả sai format).

**Cố tình bỏ:** auth/login, multi-user, edit/regenerate output,
analytics.

**Why now:** bài test đánh giá problem-solving và architecture trong
3-4h đầu, không phải sản phẩm hoàn chỉnh; các phần trên chỉ pha loãng
thời gian dành cho AI Integration (25% điểm) và Architecture (20% điểm).

## 4. User flow

Layout kiểu chat app: sidebar (shadcn/ui `Sidebar`) chứa nút "New
evaluation" và history list; main panel chỉ hiện đúng 1 view tại 1 thời
điểm nên chuyển view không cần cuộn trang.

1. Vào trang, main panel hiện form 5 field.
2. Submit, nút chuyển "Analyzing...".
3. Thành công: main panel chuyển sang kết quả; sidebar tự refresh, thêm
   entry mới.
4. Thất bại: message lỗi tại chỗ, form giữ nguyên dữ liệu để thử lại.
5. Click entry cũ trong sidebar: xem lại input và output đã sinh ra. Nút
   "New evaluation" đưa về form ngay từ bất kỳ view nào.

## 5. Architecture

```
Browser (single-flow: form -> result -> history)
   │ POST /api/evaluate { learningGoal, currentActivities, strengths, challenges, shortTermGoal }
   ▼
Next.js API route (src/app/api/evaluate/route.ts)
   │ 1. parse + Zod-validate input, invalid thì trả 400
   │ 2. load active PromptVersion từ DB (tự seed v1 nếu bảng trống)
   │ 3. gọi AI provider (src/lib/ai.ts)
   │ 4. parse + Zod-validate response JSON từ AI
   │ 5. lưu Evaluation (input + output + promptVersionId)
   │ 6. lưu RequestLog (status/latency/error), luôn ghi dù thành công hay fail
   ▼
Custom OpenAI-compatible endpoint (api.commandcode.ai/provider/v1)
   │ retry 1 lần nếu network/HTTP fail, vẫn fail thì trả 502
   │ response sai JSON/shape thì trả 422
   ▼
Frontend render 4 section, hoặc error message rõ ràng

GET /api/evaluations       -> history list
GET /api/evaluations/:id   -> input + output đầy đủ 1 evaluation
```

Postgres qua Prisma lưu `PromptVersion`, `Evaluation`, `RequestLog` (xem
`prisma/schema.prisma`). 1 Next.js app (frontend + backend) và 1 Postgres
service, chạy chung qua Docker Compose.

## 6. Technical decisions

- **Next.js full-stack:** 1 repo, 1 lần deploy, API route đủ cho scope
  hiện tại.
- **Prisma + Postgres:** evaluation history và prompt version cần query
  thật (list, tìm theo id, tìm prompt đang active), relational store phù
  hợp hơn flat file.
- **Zod validate 2 lớp (input và AI output):** input từ client không bao
  giờ được tin tưởng; AI output cũng vậy, response 200 không đồng nghĩa
  field đúng format. Đây là điểm khác biệt giữa prototype nghiệp dư và
  prototype có suy nghĩ về reliability.
- **Prompt versioning nằm trong DB, không nằm trong code:** sửa prompt
  không cần deploy lại, mỗi `Evaluation` ghi chính xác prompt version nào
  sinh ra nó.
- **`RequestLog` tách bảng riêng khỏi `Evaluation`:** request nào cũng
  ghi log kỹ thuật, kể cả request fail ngay từ bước validate input; tách
  riêng để history list không lẫn những lần submit thất bại.
- **Retry 1 lần khi provider/network lỗi, không retry khi schema sai:**
  schema sai là lỗi prompt/parsing, retry không tự sửa được.
- **Chưa có auth:** evaluation history hiện global, giới hạn cố ý, nêu rõ
  thay vì giả vờ có.
- **shadcn/ui `Sidebar`:** cần 1 chỗ điều hướng luôn hiển thị (kiểu chat
  session), chuyển giữa "new evaluation" và entry cũ không được cuộn
  trang. Base UI thay vì Radix (đổi sau khi build xong, qua `shadcn init
  -b base -f --reinstall`, đã sweep code theo checklist prop đổi giữa 2
  thư viện, không call site nào cần sửa).

## 7. Xử lý lỗi

| Case | Xử lý | Vì sao |
|---|---|---|
| Input rỗng/invalid | 400, chặn cả frontend lẫn backend | Fail sớm, tiết kiệm 1 lượt gọi AI tốn tiền và thời gian |
| AI API lỗi (network/5xx) | Retry 1 lần, vẫn fail trả 502 | Lỗi tạm thời đáng thử lại, không retry vô hạn |
| AI trả sai schema | Không retry, trả 422 luôn | Lỗi prompt/parsing, retry vô ích |
| Lỗi không lường trước | try/catch bọc ngoài, trả 500 generic | Không lộ lỗi kỹ thuật thô ra UI |

## 8. Success criteria

Prototype coi là hữu ích nếu: user nhập xong nhận output có cấu trúc, đọc
hiểu ngay; observation/action bám sát input, không chung chung kiểu
horoscope; không crash hay hiện lỗi kỹ thuật thô khi input rỗng hoặc AI
service gặp sự cố.

## 9. Known limitations

- Chưa có auth/multi-user, history là global.
- Prompt versioning chưa có UI switch/edit, phải sửa trực tiếp DB (hoặc
  `prisma studio`).
- Chưa có eval set tự động cho prompt regression.
- Độ tin cậy AI phụ thuộc endpoint có tuân thủ `response_format:
  json_object` không; nếu không, Zod vẫn reject đúng nhưng user chỉ thấy
  message retry chung chung.

## 10. Future improvements

- Admin UI tạo/kích hoạt `PromptVersion`, so sánh output giữa các version
  (A/B evaluation).
- Lưu history theo từng user khi có auth (xem Assessment 02, Task A,
  feature "progress check-in").
- Stream response AI thay vì đợi đủ JSON.
- Test cơ bản cho API route (input hợp lệ/invalid, AI failure/invalid
  response giả lập).
- Eval set nhỏ bắt regression khi đổi prompt đang active.

---

## 11. Setup instructions

### Option A: Docker Compose (app + Postgres chạy chung, production build)

```bash
cp .env.example .env   # điền AI_API_KEY
npm run docker:up      # build image app, start app + db
# -> http://localhost:3000
```

Không hot reload (production build). Sửa code xong chạy lại `npm run
docker:up`.

### Option A-dev: Docker Compose có hot reload

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# -> http://localhost:3000, sửa file trong src/ tự rebuild
```

Chạy `next dev --webpack` trong container, source mount từ host, bật
polling (bind mount Docker không luôn propagate inotify trên macOS). Lần
đầu (hoặc sau khi đổi schema) vẫn cần migrate 1 lần từ host: `npm run
db:migrate`.

### Option B: dev local, Postgres trong Docker

```bash
npm install
cp .env.example .env.local
docker compose up -d db      # chỉ Postgres, map ra localhost:5432
npm run db:migrate
npm run dev                  # http://localhost:3000
```

```bash
npm run build && npm start   # production build local
npm run lint
npm run db:seed              # seed prompt v1 thủ công (cũng tự seed ở request đầu)
```

## 12. Environment variables

| Variable | Bắt buộc | Mô tả |
|---|---|---|
| `AI_API_BASE_URL` | Có | Base URL endpoint OpenAI-compatible |
| `AI_API_KEY` | Có | API key cho endpoint trên |
| `AI_MODEL` | Không | Tên model gọi tới (mặc định: `gpt-4o-mini`) |
| `DATABASE_URL` | Có | Connection string Postgres (Prisma) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Có (Docker) | `docker-compose.yml` dùng cấu hình service `db` |
