-- JobDetail/AuditLogger insert these client-side; admin-only INSERT made every CO save fail.
-- set_row_owner trigger forces created_by_id = auth.uid() (or crew owner), so users can only create their own rows.
drop policy if exists leakage_flag_create on public.leakage_flag;
create policy leakage_flag_create on public.leakage_flag for insert to authenticated
  with check (current_user_role() in ('owner','pm','admin'));

drop policy if exists margin_history_create on public.margin_history;
create policy margin_history_create on public.margin_history for insert to authenticated
  with check (current_user_role() in ('owner','pm','admin'));

drop policy if exists audit_log_create on public.audit_log;
create policy audit_log_create on public.audit_log for insert to authenticated
  with check (current_user_role() in ('owner','pm','admin'));
