import type { Row } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import SubmitButton from "./SubmitButton";
import RichText from "./RichText";
import { deleteDraft, publishDoc, returnDoc, saveDoc, submitDoc } from "@/actions/documents";

/** Edit / submit / publish controls shared by minutes and reports. */
export default function DocPanel({ kind, doc, user, rich }: { kind: "minutes" | "report"; doc: Row; user: SessionUser; rich?: boolean }) {
  const isChair = user.role === "chairperson";
  const editable = doc.status !== "published";
  const hidden = (
    <>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={doc.id} />
    </>
  );
  const steps: [string, string][] = [["draft", "Draft"], ["pending", "Waiting for approval"], ["published", "Published"]];
  const at = steps.findIndex(([k]) => k === doc.status);
  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold" aria-label="Approval steps">
            {steps.map(([key, label], i) => (
              <li key={key} className="flex items-center gap-2" aria-current={i === at ? "step" : undefined}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i < at ? "bg-emerald-600 text-white" : i === at ? "bg-flag-blue text-white" : "bg-slate-100 text-slate-400"}`}>{i < at ? "✓" : i + 1}</span>
                <span className={i === at ? "text-ink" : "text-slate-400"}>{label}</span>
                {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-slate-200" />}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-sm text-slate-600">
            {doc.status === "draft" && "Only you and the Chairperson can see this. Submit it when it is ready."}
            {doc.status === "pending" && (isChair ? "Review it, then publish it or return it for changes." : "The Chairperson is reviewing it. Editing it now returns it to draft.")}
            {doc.status === "published" && "Public on the bulletin."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {doc.status === "draft" && (
            <form action={submitDoc}>{hidden}<SubmitButton pending="Submitting...">Submit for approval</SubmitButton></form>
          )}
          {isChair && doc.status !== "published" && (
            <form action={publishDoc}>{hidden}<SubmitButton className="btn-red" pending="Publishing...">Approve and publish</SubmitButton></form>
          )}
          {isChair && doc.status !== "draft" && (
            <form action={returnDoc} className="flex gap-2">{hidden}
              <label className="sr-only" htmlFor={`note-${doc.id}`}>Note to the author (optional)</label>
              <input id={`note-${doc.id}`} name="note" placeholder="Note (optional)" className="input w-40" />
              <SubmitButton className="btn-outline" pending="...">{doc.status === "published" ? "Unpublish" : "Return to draft"}</SubmitButton></form>
          )}
        </div>
      </div>

      {editable ? (
        <form action={saveDoc} className="card space-y-4 sm:p-6">
          {hidden}
          <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" defaultValue={doc.title} required className="input" /></div>
          <div>
            <label className="label" htmlFor="content">{kind === "report" ? "Plain-language summary" : "Minutes"}</label>
            <textarea id="content" name="content" rows={rich ? 22 : 10} defaultValue={doc.content} required className="input font-mono text-[13px] leading-relaxed" />
            <p className="hint">{rich ? "Use # for headings and - for bullet points." : "Edit the wording. The numbers below come from the ledger and cannot be edited here."} Saving a submitted document returns it to draft.</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <SubmitButton className="btn-outline" pending="Saving...">Save changes</SubmitButton>
          </div>
        </form>
      ) : rich ? (
        <div className="card sm:p-6"><RichText text={doc.content} /></div>
      ) : null}

      {doc.status === "draft" && (
        <form action={deleteDraft} className="flex justify-end">{hidden}<SubmitButton className="btn-sm btn text-slate-500 hover:bg-red-50 hover:text-flag-red" pending="Deleting...">Delete this draft</SubmitButton></form>
      )}
    </div>
  );
}
