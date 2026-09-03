export function SessionLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        در حال بررسی نشست کاربری...
      </div>
    </div>
  );
}
