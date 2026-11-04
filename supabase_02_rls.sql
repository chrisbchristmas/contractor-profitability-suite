
-- Helper: current platform user's role, read from app_user table keyed by auth.uid()
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.app_user where id = auth.uid();
$$;

create policy "audit_log_create" on public."audit_log" for insert with check (public.current_user_role() = 'admin');
create policy "audit_log_read" on public."audit_log" for select using (public.current_user_role() = 'admin');
create policy "audit_log_update" on public."audit_log" for update using (public.current_user_role() = 'admin');
create policy "audit_log_delete" on public."audit_log" for delete using (public.current_user_role() = 'admin');
create policy "co_template_create" on public."co_template" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "co_template_read" on public."co_template" for select using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "co_template_update" on public."co_template" for update using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "co_template_delete" on public."co_template" for delete using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "calculator_usage_create" on public."calculator_usage" for insert with check (created_by_id = auth.uid());
create policy "calculator_usage_read" on public."calculator_usage" for select using (public.current_user_role() = 'admin');
create policy "calculator_usage_update" on public."calculator_usage" for update using (public.current_user_role() = 'admin');
create policy "calculator_usage_delete" on public."calculator_usage" for delete using (public.current_user_role() = 'admin');
create policy "change_order_create" on public."change_order" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "change_order_read" on public."change_order" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "change_order_update" on public."change_order" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "change_order_delete" on public."change_order" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "cost_preset_create" on public."cost_preset" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "cost_preset_read" on public."cost_preset" for select using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "cost_preset_update" on public."cost_preset" for update using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "cost_preset_delete" on public."cost_preset" for delete using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "crew_cost_create" on public."crew_cost" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "crew_cost_read" on public."crew_cost" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "crew_cost_update" on public."crew_cost" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "crew_cost_delete" on public."crew_cost" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "customer_create" on public."customer" for insert with check (public.current_user_role() = 'admin');
create policy "customer_read" on public."customer" for select using ((email = auth.jwt() ->> 'email' OR public.current_user_role() = 'admin'));
create policy "customer_update" on public."customer" for update using ((email = auth.jwt() ->> 'email' OR public.current_user_role() = 'admin'));
create policy "customer_delete" on public."customer" for delete using (public.current_user_role() = 'admin');
create policy "daily_log_create" on public."daily_log" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "daily_log_read" on public."daily_log" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "daily_log_update" on public."daily_log" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "daily_log_delete" on public."daily_log" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "estimate_create" on public."estimate" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "estimate_read" on public."estimate" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "estimate_update" on public."estimate" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "estimate_delete" on public."estimate" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "invoice_create" on public."invoice" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "invoice_read" on public."invoice" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "invoice_update" on public."invoice" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "invoice_delete" on public."invoice" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "job_create" on public."job" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "job_read" on public."job" for select using ((user_id = auth.uid() OR assigned_user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "job_update" on public."job" for update using ((user_id = auth.uid() OR assigned_user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "job_delete" on public."job" for delete using ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "job_attachment_create" on public."job_attachment" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "job_attachment_read" on public."job_attachment" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "job_attachment_update" on public."job_attachment" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "job_attachment_delete" on public."job_attachment" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "job_expense_create" on public."job_expense" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "job_expense_read" on public."job_expense" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "job_expense_update" on public."job_expense" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "job_expense_delete" on public."job_expense" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "job_template_create" on public."job_template" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "job_template_read" on public."job_template" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "job_template_update" on public."job_template" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "job_template_delete" on public."job_template" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "lead_create" on public."lead" for insert with check (true);
create policy "lead_read" on public."lead" for select using (public.current_user_role() = 'admin');
create policy "lead_update" on public."lead" for update using (public.current_user_role() = 'admin');
create policy "lead_delete" on public."lead" for delete using (public.current_user_role() = 'admin');
create policy "leakage_flag_create" on public."leakage_flag" for insert with check (public.current_user_role() = 'admin');
create policy "leakage_flag_read" on public."leakage_flag" for select using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "leakage_flag_update" on public."leakage_flag" for update using (public.current_user_role() = 'admin');
create policy "leakage_flag_delete" on public."leakage_flag" for delete using (public.current_user_role() = 'admin');
create policy "lien_waiver_create" on public."lien_waiver" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "lien_waiver_read" on public."lien_waiver" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "lien_waiver_update" on public."lien_waiver" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "lien_waiver_delete" on public."lien_waiver" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "margin_history_create" on public."margin_history" for insert with check (public.current_user_role() = 'admin');
create policy "margin_history_read" on public."margin_history" for select using ((public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "margin_history_update" on public."margin_history" for update using (public.current_user_role() = 'admin');
create policy "margin_history_delete" on public."margin_history" for delete using (public.current_user_role() = 'admin');
create policy "notification_create" on public."notification" for insert with check ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "notification_read" on public."notification" for select using ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "notification_update" on public."notification" for update using ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "notification_delete" on public."notification" for delete using ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "pdf_record_create" on public."pdf_record" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "pdf_record_read" on public."pdf_record" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "pdf_record_update" on public."pdf_record" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "pdf_record_delete" on public."pdf_record" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "proposal_create" on public."proposal" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "proposal_read" on public."proposal" for select using ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "proposal_update" on public."proposal" for update using ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "proposal_delete" on public."proposal" for delete using ((user_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "selection_create" on public."selection" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "selection_read" on public."selection" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "selection_update" on public."selection" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "selection_delete" on public."selection" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "seo_article_create" on public."seo_article" for insert with check (public.current_user_role() = 'admin');
create policy "seo_article_read" on public."seo_article" for select using ((status = 'published' OR public.current_user_role() = 'admin'));
create policy "seo_article_update" on public."seo_article" for update using (public.current_user_role() = 'admin');
create policy "seo_article_delete" on public."seo_article" for delete using (public.current_user_role() = 'admin');
create policy "seo_topic_create" on public."seo_topic" for insert with check (public.current_user_role() = 'admin');
create policy "seo_topic_read" on public."seo_topic" for select using (public.current_user_role() = 'admin');
create policy "seo_topic_update" on public."seo_topic" for update using (public.current_user_role() = 'admin');
create policy "seo_topic_delete" on public."seo_topic" for delete using (public.current_user_role() = 'admin');
create policy "subcontractor_po_create" on public."subcontractor_po" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "subcontractor_po_read" on public."subcontractor_po" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "subcontractor_po_update" on public."subcontractor_po" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "subcontractor_po_delete" on public."subcontractor_po" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "task_create" on public."task" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "task_read" on public."task" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "task_update" on public."task" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "task_delete" on public."task" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "time_entry_create" on public."time_entry" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "time_entry_read" on public."time_entry" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "time_entry_update" on public."time_entry" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));
create policy "time_entry_delete" on public."time_entry" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));

create policy "app_user_select_own_or_admin" on public."app_user" for select
  using (id = auth.uid() or public.current_user_role() = 'admin');
create policy "app_user_update_own_or_admin" on public."app_user" for update
  using (id = auth.uid() or public.current_user_role() = 'admin');
create policy "app_user_insert_self" on public."app_user" for insert
  with check (id = auth.uid());

create policy "warranty_create" on public."warranty" for insert with check ((public.current_user_role() = 'owner' OR public.current_user_role() = 'pm' OR public.current_user_role() = 'admin'));
create policy "warranty_read" on public."warranty" for select using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "warranty_update" on public."warranty" for update using ((created_by_id = auth.uid() OR public.current_user_role() = 'owner' OR public.current_user_role() = 'admin'));
create policy "warranty_delete" on public."warranty" for delete using ((created_by_id = auth.uid() OR public.current_user_role() = 'admin'));