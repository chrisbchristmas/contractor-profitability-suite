
-- updated_date auto-touch trigger, applied per table
create or replace function public.touch_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

create trigger "audit_log_touch_updated" before update on public."audit_log" for each row execute function public.touch_updated_date();
create trigger "co_template_touch_updated" before update on public."co_template" for each row execute function public.touch_updated_date();
create trigger "calculator_usage_touch_updated" before update on public."calculator_usage" for each row execute function public.touch_updated_date();
create trigger "change_order_touch_updated" before update on public."change_order" for each row execute function public.touch_updated_date();
create trigger "cost_preset_touch_updated" before update on public."cost_preset" for each row execute function public.touch_updated_date();
create trigger "crew_cost_touch_updated" before update on public."crew_cost" for each row execute function public.touch_updated_date();
create trigger "customer_touch_updated" before update on public."customer" for each row execute function public.touch_updated_date();
create trigger "daily_log_touch_updated" before update on public."daily_log" for each row execute function public.touch_updated_date();
create trigger "estimate_touch_updated" before update on public."estimate" for each row execute function public.touch_updated_date();
create trigger "invoice_touch_updated" before update on public."invoice" for each row execute function public.touch_updated_date();
create trigger "job_touch_updated" before update on public."job" for each row execute function public.touch_updated_date();
create trigger "job_attachment_touch_updated" before update on public."job_attachment" for each row execute function public.touch_updated_date();
create trigger "job_expense_touch_updated" before update on public."job_expense" for each row execute function public.touch_updated_date();
create trigger "job_template_touch_updated" before update on public."job_template" for each row execute function public.touch_updated_date();
create trigger "lead_touch_updated" before update on public."lead" for each row execute function public.touch_updated_date();
create trigger "leakage_flag_touch_updated" before update on public."leakage_flag" for each row execute function public.touch_updated_date();
create trigger "lien_waiver_touch_updated" before update on public."lien_waiver" for each row execute function public.touch_updated_date();
create trigger "margin_history_touch_updated" before update on public."margin_history" for each row execute function public.touch_updated_date();
create trigger "notification_touch_updated" before update on public."notification" for each row execute function public.touch_updated_date();
create trigger "pdf_record_touch_updated" before update on public."pdf_record" for each row execute function public.touch_updated_date();
create trigger "proposal_touch_updated" before update on public."proposal" for each row execute function public.touch_updated_date();
create trigger "selection_touch_updated" before update on public."selection" for each row execute function public.touch_updated_date();
create trigger "seo_article_touch_updated" before update on public."seo_article" for each row execute function public.touch_updated_date();
create trigger "seo_topic_touch_updated" before update on public."seo_topic" for each row execute function public.touch_updated_date();
create trigger "subcontractor_po_touch_updated" before update on public."subcontractor_po" for each row execute function public.touch_updated_date();
create trigger "task_touch_updated" before update on public."task" for each row execute function public.touch_updated_date();
create trigger "time_entry_touch_updated" before update on public."time_entry" for each row execute function public.touch_updated_date();
create trigger "app_user_touch_updated" before update on public."app_user" for each row execute function public.touch_updated_date();
create trigger "warranty_touch_updated" before update on public."warranty" for each row execute function public.touch_updated_date();

-- Auto-create app_user row when a new auth.users row is created (platform user signup)
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_user (id, role) values (new.id, 'owner')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
