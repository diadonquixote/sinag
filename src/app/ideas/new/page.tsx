import { redirect } from "next/navigation";
import { Flash, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { currentUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/roles";
import { submitIdea } from "@/actions/ideas";

export const metadata = { title: "Suggest a project" };

export default async function NewIdea({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (!(await currentUser())) redirect("/login");
  return (
    <div className="container-x py-10 sm:py-12"><div className="max-w-2xl">
      <PageHeader eyebrow="Your idea" title="Suggest a project">
        What would make our community better? The SK reviews every idea. Approved ideas go to a vote.
      </PageHeader>
      <Flash sp={sp} />
      <form action={submitIdea} className="card space-y-4">
        <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" required minLength={5} maxLength={140} className="input" placeholder="e.g. Linis-Ilog community clean-up" /></div>
        <div><label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" required defaultValue="" className="input"><option value="" disabled>Choose...</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label" htmlFor="description">Describe it</label>
          <textarea id="description" name="description" rows={6} required minLength={30} className="input" placeholder="What is it? Who is it for? Why does it matter?" /></div>
        <div><label className="label" htmlFor="est_budget">Estimated budget (PHP)</label>
          <input id="est_budget" name="est_budget" inputMode="decimal" defaultValue="0" className="input" /><p className="hint">A rough guess is fine. Put 0 if you are not sure.</p></div>
        <SubmitButton pending="Sending...">Send my idea</SubmitButton>
      </form>
    </div></div>
  );
}
