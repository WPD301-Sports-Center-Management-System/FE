export function HomePage({ role }: { role: string }) {
  return (
    <section>
      <p className="text-sm font-medium text-primary">{role}</p>
      <h1 className="mt-1 text-3xl font-bold text-text-primary">Môi trường Web đã sẵn sàng</h1>
      <p className="mt-3 max-w-2xl text-text-muted">
        Tạo từng chức năng trong <code>src/features</code>, gọi API qua <code>src/shared/api</code> và khai báo route tại <code>src/app/router.tsx</code>.
      </p>
    </section>
  )
}
