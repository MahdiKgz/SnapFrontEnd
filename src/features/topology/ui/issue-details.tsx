import { useState } from "react";

import { useGetAnalysisIssuesQuery } from "../api/topology-api";

export function IssueDetails({ jobId, code }: { jobId: string; code?: string }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const query = useGetAnalysisIssuesQuery({ jobId, code, page }, { skip: !open });
  const data = query.currentData?.data;
  return (
    <section className="mt-3 rounded-xl border border-border p-3 text-xs">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="w-full text-right font-semibold"
      >
        جزئیات خطاها
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {query.isFetching && <p role="status">در حال دریافت…</p>}
          {query.isError && (
            <div role="alert">
              دریافت خطاها انجام نشد.{" "}
              <button type="button" onClick={() => void query.refetch()}>
                تلاش دوباره
              </button>
            </div>
          )}
          {data && (
            <>
              <p>{data.total.toLocaleString("fa-IR")} خطا</p>
              <div className="max-h-64 overflow-auto overscroll-contain">
                {data.items.map((issue) => (
                  <details key={issue.issueIndex} className="border-b border-border py-2">
                    <summary className="cursor-pointer">
                      <bdi dir="ltr">{issue.code}</bdi> — عارضه{" "}
                      {(issue.featureIndex + 1).toLocaleString("fa-IR")}
                    </summary>
                    <pre
                      dir="ltr"
                      className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-[10px]"
                    >
                      {JSON.stringify(issue.details, null, 2)}
                    </pre>
                  </details>
                ))}
                {!data.total && <p>خطایی وجود ندارد.</p>}
              </div>
              <nav aria-label="صفحه‌بندی خطاها" className="flex justify-between gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  قبلی
                </button>
                <span>
                  {page.toLocaleString("fa-IR")} /{" "}
                  {Math.max(1, Math.ceil(data.total / data.limit)).toLocaleString("fa-IR")}
                </span>
                <button
                  type="button"
                  disabled={page * data.limit >= data.total || query.isFetching}
                  onClick={() => setPage(page + 1)}
                >
                  بعدی
                </button>
              </nav>
            </>
          )}
        </div>
      )}
    </section>
  );
}
