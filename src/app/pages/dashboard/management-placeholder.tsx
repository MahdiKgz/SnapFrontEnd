export function ManagementPlaceholder({ title }: { title: string }) {
  return (
    <section className="h-full overflow-y-auto p-6 md:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-card-foreground">
          <p className="text-sm leading-7">به صفحهٔ {title} خوش آمدید.</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            امکانات این بخش به‌زودی اضافه می‌شود.
          </p>
        </div>
      </div>
    </section>
  );
}
