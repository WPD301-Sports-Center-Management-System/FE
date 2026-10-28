export function HomePage({ role }: { role: string }) {
  return (
    <section>
      <p className="text-sm font-medium text-primary">{role}</p>
      <h1 className="mt-1 text-3xl font-bold text-text-primary">Trang chủ</h1>
      <p className="mt-3 max-w-2xl text-text-muted">
        Chọn chức năng trong menu để bắt đầu công việc.
      </p>
    </section>
  )
}
