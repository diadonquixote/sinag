import type { Row } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { Badge } from "./ui";
import SubmitButton from "./SubmitButton";
import RichText from "./RichText";
import { DOC_STATUS } from "@/lib/roles";
import { deleteDraft, publishDoc, returnDoc, saveDoc, submitDoc } from "@/actions/documents";

/** Edit / submit / publish controls shared by minutes and reports. */
export default function DocPanel({ kind, doc, user, rich }: { kind: "minutes" | "report"; doc: Row; user: SessionUser; rich?: boolean }) {
  const st = DOC_STATUS[doc.status];
  const isChair = user.role === "chairperson";
  const editable = doc.status !== "published";
  const hidden = (
    <>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={doc.id} />
    </>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={st.className}>{st.label}</Badge>
        {doc.status === "pending" && isChair && <span className="text-sm text-slate-600">Review it, then publish or return it for changes.</span>}
        {doc.status === "published" && <span className="text-sm text-slate-600">Public on the bulletin.</span>}
      </div>

      {editable ? (
        <form action={saveDoc} className="card space-y-3">
          {hidden}
          <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" defaultValue={doc.title} required className="input" /></div>
          <div>
            <label className="label" htmlFor="content">{kind === "report" ? "Plain-language summary" : "Minutes"}</label>
            <textarea id="content" name="content" rows={rich ? 22 : 10} defaultValue={doc.content} required className="input font-mono text-[13px]" />
            <p className="hint">{rich ? "Use # for headings and - for bullet points." : "Edit the wording. The numbers below come from the ledger and cannot be edited here."} Saving a submitted document returns it to draft.</p>
          </div>
          <SubmitButton className="btn-outline" pending="Saving...">Save changes</SubmitButton>
        </form>
      ) : rich ? (
        <div className="card"><RichText text={doc.content} /></div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {doc.status === "draft" && (
          <form action={submitDoc}>{hidden}<SubmitButton pending="Submitting...">Submit for approval</SubmitButton></form>
        )}
        {isChair && doc.status !== "published" && (
          <form action={publishDoc}>{hidden}<SubmitButton className="btn-red" pending="Publishing...">Approve and publish</SubmitButton></form>
        )}
        {isChair && doc.status !== "draft" && (
          <form action={returnDoc} className="flex gap-2">{hidden}
            <input name="note" placeholder="Note (optional)" className="input w-48" aria-label="Note" />
            <SubmitButton className="btn-outline" pending="...">{doc.status === "published" ? "Unpublish" : "Return to draft"}</SubmitButton></form>
        )}
        {doc.status === "draft" && (
          <form action={deleteDraft}>{hidden}<SubmitButton className="btn-outline text-flag-red" pending="Deleting...">Delete draft</SubmitButton></form>
        )}
      </div>
    </div>
  );
}
