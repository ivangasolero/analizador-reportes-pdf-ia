import { supabase } from '../supabase/client';

export type AuditAction = 'report_created' | 'analysis_run' | 'user_invited' | 'user_suspended' | 'role_changed' | 'export_pdf';

export async function logAudit(action: AuditAction, entityType?: string, entityId?: string, metadata?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
  });
}
