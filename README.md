# APEXFIT Web

React + TypeScript + Vite. Web phục vụ Manager, Receptionist, Coach; có khu vực Member và các trang test mục tiêu. [Tài liệu hiện hành](../Docs/README.md) · [Chạy local](../Docs/PROJECT_STATUS_AND_RUN_GUIDE.md).

```powershell
npm ci
npm run dev
```

Giữ `.env` hiện có. Chạy với BE local: `VITE_API_URL=/api/v1`, `VITE_API_BASE_URL=/api/v1`, `VITE_PROXY_TARGET=http://localhost:4000`, `VITE_USE_MOCK=false`. Restart Vite khi đổi env. Chọn rõ local/remote; backend remote chưa chắc có code/migration mới.

## Luồng đang dùng

- Bán gói PT có lịch trước thanh toán; Coach điều phối lịch sau mua. `PAID` chưa đủ xác nhận quyền lợi đã được áp dụng.
- Coach `/coach/goals`: số đo, đề xuất mục tiêu, tiến độ và phiếu buổi hoàn thành; `/coach/goals/sheet/:bookingId` để xem/ghi phiếu.
- Member `/member/goals`: mong muốn tùy chọn, xác nhận/yêu cầu sửa đề xuất, tiến độ và phản hồi phiên bản phiếu.
- Manager `/manager/goals`: phản ánh, timeline và chất lượng phiếu.

Các màn mục tiêu là giao diện test cơ bản. Không dùng form mục tiêu cũ, `progressScore` 0–100 hay nút tự đánh dấu đạt; Backend tính kết quả. [Hướng dẫn test](../Docs/HUONG_DAN_TEST_MUC_TIEU_VA_PHIEU_SAU_BUOI_2026-11-03.md) nêu thao tác và giới hạn từng vai trò.

Source tại `src/`; luồng goal lab tại `src/features/goal-lab/`, API/query theo cấu trúc hiện có. Khi sửa màn, đối chiếu [OpenAPI](../Docs/API_CONTRACT_PT_2026-11.md) và router BE.

```powershell
npm test
npm run build
```

[Bàn giao triển khai](../Docs/GOAL_PROGRESS_HANDOFF_2026-11-03.md) ghi kết quả kiểm chứng và phần còn thiếu. PRD và tài liệu bố cục màn không thay biên bản nghiệm thu UI.
