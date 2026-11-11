# APEXFIT Web

React + TypeScript + Vite; phục vụ Manager, Receptionist, Coach và Member.

- [Tài liệu hiện hành](../Docs/README.md)
- [Chạy local](../Docs/PROJECT_STATUS_AND_RUN_GUIDE.md)
- [Nghiệp vụ](../Docs/SYSTEM_BUSINESS_CONTEXT_SUMMARY.md)
- [Tra API](../Docs/API_CONTRACT_PT_2026-11.md)
- [Phần chưa hoàn tất](../Docs/OPEN_ITEMS.md)

Trong FE: npm ci, npm run dev. Env local: VITE_API_URL=/api/v1, VITE_API_BASE_URL=/api/v1, VITE_PROXY_TARGET=http://localhost:4000, VITE_USE_MOCK=false. Restart Vite khi đổi env.

Gói theo bậc Coach; checkout preview toàn chuỗi trước thanh toán. Form 1 theo purchase; Form 2 theo buổi COMPLETED còn hiệu lực. Start trực tiếp khi có lượt gym hợp lệ. Điều kiện/quyền lấy từ server; code ví BE mới còn cần đối chiếu consumer, xem OPEN_ITEMS.

Source ở src; lộ trình ở src/features/goal-lab. Kiểm tra: npm test, npm run build, npm run lint. Test fixture/build không thay UAT nhiều vai trò, mất mạng và thanh toán.
