import { sql } from "./db";

/** Records who did what. Failures here must never block the real action. */
export async function audit(
  userId: number | null,
  action: string,
  entity: string,
  entityId: number | null,
  detail?: string,
): Promise<void> {
  try {
    await sql`
      insert into audit_log (user_id, action, entity, entity_id, detail)
      values (${userId}, ${action}, ${entity}, ${entityId}, ${detail?.slice(0, 300) ?? null})
    `;
  } catch (err) {
    console.error("audit log failed", err);
  }
}
