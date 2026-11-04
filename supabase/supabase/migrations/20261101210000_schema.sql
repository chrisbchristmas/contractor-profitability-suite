-- Auto-generated from base44/entities/*.jsonc
create table if not exists public."audit_log" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "record_type" text not null,
  "record_id" text not null,
  "action" text not null,
  "field_changed" text,
  "old_value" text,
  "new_value" text,
  "changed_by" uuid not null,
  "changed_by_name" text,
  "changed_by_role" text,
  "description" text,
  constraint "audit_log_action_check" check ("action" is null or "action" in ('create', 'update', 'delete', 'approve'))
);
alter table public."audit_log" enable row level security;

create table if not exists public."co_template" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "category" text,
  "trade" text,
  "description" text,
  "equipment_cost" numeric default 0,
  "labor_burden_percent" numeric,
  "labor_hours" numeric default 0,
  "labor_rate" numeric default 0,
  "markup_percent" numeric,
  "material_cost" numeric default 0,
  "overhead_percent" numeric,
  "subcontractor_cost" numeric default 0,
  "tax_percent" numeric default 0,
  "template_name" text not null
);
alter table public."co_template" enable row level security;

create table if not exists public."calculator_usage" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "labor_hours" numeric,
  "labor_rate" numeric,
  "labor_burden_percent" numeric,
  "materials_cost" numeric,
  "equipment_cost" numeric,
  "subcontractor_cost" numeric,
  "overhead_percent" numeric,
  "markup_percent" numeric,
  "tax_percent" numeric,
  "target_margin_percent" numeric,
  "trade_preset" text,
  "true_cost" numeric,
  "client_price" numeric,
  "profit_dollars" numeric,
  "actual_margin_percent" numeric,
  "leakage_status" text,
  "emailed_result_to" text,
  "clicked_signup_cta" boolean default false,
  "referrer" text,
  "user_agent" text,
  constraint "calculator_usage_leakage_status_check" check ("leakage_status" is null or "leakage_status" in ('green', 'yellow', 'red'))
);
alter table public."calculator_usage" enable row level security;

create table if not exists public."change_order" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "actual_labor_hours" numeric,
  "approval_method" text,
  "approval_required" boolean default true,
  "approval_token" text,
  "approved_at" timestamptz,
  "approved_by" uuid,
  "approved_by_name" text,
  "baseline_material_cost" numeric,
  "base_hourly_wage" numeric,
  "benefits_percent" numeric default 5,
  "burden_amount_per_hour" numeric,
  "decline_reason" text,
  "declined_at" timestamptz,
  "description" text not null,
  "equipment_cost" numeric default 0,
  "estimated_labor_hours" numeric,
  "final_price_to_client" numeric,
  "fully_loaded_rate" numeric,
  "general_liability_percent" numeric default 3,
  "job_id" uuid not null,
  "labor_burden_percent" numeric,
  "labor_hours" numeric default 0,
  "labor_rate" numeric default 0,
  "leakage_amount" numeric,
  "markup_percent" numeric,
  "material_cost" numeric default 0,
  "overhead_amount" numeric,
  "overhead_percent" numeric,
  "payment_due_days" numeric,
  "payroll_tax_percent" numeric default 12,
  "photos" jsonb,
  "sell_price" numeric,
  "signer_ip" text,
  "signer_name" text,
  "signed_at" timestamptz,
  "status" text default 'draft',
  "subcontractor_cost" numeric default 0,
  "subtotal_before_overhead" numeric,
  "target_margin" numeric,
  "target_sell_price" numeric,
  "tax_amount" numeric,
  "tax_percent" numeric default 0,
  "total_cost" numeric,
  "total_labor_burden_cost" numeric,
  "true_labor_cost" numeric,
  "true_margin_percent" numeric,
  "viewed_at" timestamptz,
  "workers_comp_percent" numeric default 8,
  constraint "change_order_status_check" check ("status" is null or "status" in ('draft', 'sent', 'viewed', 'approved', 'declined'))
);
alter table public."change_order" enable row level security;

create table if not exists public."cost_preset" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "labor_burden_percent" numeric,
  "labor_rate" numeric,
  "markup_percent" numeric,
  "overhead_percent" numeric,
  "preset_name" text not null
);
alter table public."cost_preset" enable row level security;

create table if not exists public."crew_cost" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "job_id" uuid not null,
  "job_name" text,
  "worker_name" text not null,
  "worker_type" text default 'Employee',
  "trade" text,
  "hourly_rate" numeric,
  "quoted_amount" numeric,
  "hours_worked" numeric,
  "total_cost" numeric,
  "date" date,
  "notes" text,
  constraint "crew_cost_worker_type_check" check ("worker_type" is null or "worker_type" in ('Employee', 'Subcontractor'))
);
alter table public."crew_cost" enable row level security;

create table if not exists public."customer" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "annual_profit_goal" numeric,
  "base_hourly_wage" numeric,
  "be_avg_job_value" numeric,
  "be_gross_margin_percent" numeric,
  "be_insurance" numeric default 0,
  "be_marketing" numeric default 0,
  "be_other" numeric default 0,
  "be_phone_utilities" numeric default 0,
  "be_rent_office" numeric default 0,
  "be_salaries_non_field" numeric default 0,
  "be_software_tools" numeric default 0,
  "be_vehicle_equipment" numeric default 0,
  "benefits_percent" numeric default 5,
  "company_name" text,
  "default_markup_percent" numeric default 35,
  "default_overhead_percent" numeric default 10,
  "email" text not null,
  "full_name" text,
  "general_liability_percent" numeric default 3,
  "labor_burden_percent" numeric default 35,
  "password_hash" text,
  "payroll_tax_percent" numeric default 12,
  "phone" text,
  "reset_token" text,
  "reset_token_expires_at" timestamptz,
  "session_token" text,
  "state" text,
  "stripe_customer_id" text,
  "subscription_plan" text,
  "subscription_status" text default 'trial',
  "target_margin_percent" numeric default 30,
  "trade" text,
  "trade_preset" text,
  "trial_ends_at" timestamptz,
  "variance_alert_threshold_percent" numeric default 8,
  "workers_comp_percent" numeric default 8,
  constraint "customer_subscription_status_check" check ("subscription_status" is null or "subscription_status" in ('trial', 'active', 'past_due', 'canceled')),
  constraint "customer_trade_check" check ("trade" is null or "trade" in ('Roofing', 'Painting', 'Electrical', 'Plumbing', 'HVAC', 'General Carpentry/Remodeling', 'Flooring', 'Landscaping/Hardscape', 'Concrete')),
  constraint "customer_trade_preset_check" check ("trade_preset" is null or "trade_preset" in ('General Contractor', 'Painting', 'Roofing', 'HVAC', 'Electrical', 'Plumbing'))
);
alter table public."customer" enable row level security;

create table if not exists public."daily_log" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "job_id" uuid not null,
  "job_name" text,
  "log_date" date not null,
  "weather" text,
  "crew_count" numeric,
  "hours_worked" numeric,
  "work_performed" text,
  "issues_noted" text,
  constraint "daily_log_weather_check" check ("weather" is null or "weather" in ('Clear', 'Cloudy', 'Rain', 'Snow', 'Wind'))
);
alter table public."daily_log" enable row level security;

create table if not exists public."estimate" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "contract_price" numeric not null,
  "estimate_name" text not null,
  "estimated_labor_cost" numeric default 0,
  "estimated_material_cost" numeric default 0,
  "estimated_overhead" numeric default 0,
  "estimated_subcontractor_cost" numeric default 0,
  "risk_level" text,
  "target_margin_percent" numeric,
  constraint "estimate_risk_level_check" check ("risk_level" is null or "risk_level" in ('Low Risk', 'Moderate Risk', 'High Risk'))
);
alter table public."estimate" enable row level security;

create table if not exists public."invoice" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "change_order_ids" jsonb,
  "client_name" text,
  "due_date" date,
  "job_id" uuid not null,
  "job_name" text,
  "invoice_number" text,
  "line_items" jsonb,
  "notes" text,
  "paid_date" date,
  "sent_date" date,
  "payment_status" text default 'unpaid',
  "payment_received_date" date,
  "payment_amount" numeric,
  "status" text default 'draft',
  "subtotal" numeric,
  "tax_amount" numeric,
  "total_amount" numeric not null,
  constraint "invoice_payment_status_check" check ("payment_status" is null or "payment_status" in ('unpaid', 'partially_paid', 'paid', 'overdue')),
  constraint "invoice_status_check" check ("status" is null or "status" in ('draft', 'sent', 'paid', 'overdue'))
);
alter table public."invoice" enable row level security;

create table if not exists public."job" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "actual_labor_hours" numeric,
  "assigned_user_id" uuid,
  "client_name" text,
  "client_notes" text,
  "completion_date" date,
  "contract_price" numeric,
  "contract_value" numeric not null,
  "estimated_cost" numeric not null,
  "estimated_equipment_cost" numeric,
  "estimated_labor_cost" numeric,
  "estimated_labor_hours" numeric,
  "estimated_material_cost" numeric,
  "estimated_remaining_costs" numeric,
  "estimated_subcontractor_cost" numeric,
  "job_name" text not null,
  "labor_burden_percent" numeric,
  "labor_rate" numeric,
  "material_cost" numeric,
  "material_markup_percent" numeric,
  "overhead_cost" numeric,
  "pipeline_status" text default 'Active',
  "profit_alerts" text,
  "profit_per_hour" numeric,
  "required_material_markup" numeric,
  "share_token" text,
  "show_co_details" boolean default false,
  "show_contract_value" boolean default false,
  "start_date" date,
  "status" text default 'active',
  "subcontractor_cost" numeric,
  "subcontractor_markup_percent" numeric,
  "target_margin_percent" numeric,
  "target_profit_per_hour" numeric,
  "total_estimated_hours" numeric,
  "true_margin_percent" numeric,
  "user_id" uuid,
  "variance_alert_threshold_percent" numeric,
  "wip_pct_complete_override" numeric,
  constraint "job_pipeline_status_check" check ("pipeline_status" is null or "pipeline_status" in ('Bidding', 'Active', 'Punch List', 'Complete', 'Invoiced')),
  constraint "job_status_check" check ("status" is null or "status" in ('active', 'completed'))
);
alter table public."job" enable row level security;

create table if not exists public."job_attachment" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "category" text default 'other',
  "change_order_id" uuid,
  "file_name" text not null,
  "file_type" text,
  "file_url" text not null,
  "job_id" uuid not null,
  "notes" text,
  constraint "job_attachment_category_check" check ("category" is null or "category" in ('contract', 'permit', 'photo', 'invoice', 'other'))
);
alter table public."job_attachment" enable row level security;

create table if not exists public."job_expense" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "job_id" uuid not null,
  "job_name" text,
  "category" text not null,
  "amount" numeric not null,
  "note" text,
  "date" date,
  constraint "job_expense_category_check" check ("category" is null or "category" in ('labor', 'materials', 'subcontractor', 'equipment_other'))
);
alter table public."job_expense" enable row level security;

create table if not exists public."job_template" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "template_name" text not null,
  "trade_type" text,
  "description" text,
  "estimated_labor_hours" numeric,
  "estimated_labor_cost" numeric,
  "estimated_material_cost" numeric,
  "overhead_percent" numeric,
  "profit_target_percent" numeric,
  "notes" text
);
alter table public."job_template" enable row level security;

create table if not exists public."lead" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "email" text not null,
  "name" text,
  "source" text,
  "trade" text,
  "calc_inputs" jsonb,
  "calc_result" jsonb,
  "status" text default 'new',
  "converted" boolean default false,
  constraint "lead_status_check" check ("status" is null or "status" in ('new', 'contacted', 'converted', 'unsubscribed'))
);
alter table public."lead" enable row level security;

create table if not exists public."leakage_flag" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "change_order_id" uuid not null,
  "flag_message" text not null,
  "flag_type" text not null
);
alter table public."leakage_flag" enable row level security;

create table if not exists public."lien_waiver" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "job_id" uuid not null,
  "job_name" text,
  "waiver_type" text,
  "party_name" text not null,
  "amount" numeric,
  "date_issued" date,
  "date_received" date,
  "status" text default 'Pending',
  "notes" text,
  constraint "lien_waiver_waiver_type_check" check ("waiver_type" is null or "waiver_type" in ('Conditional', 'Unconditional')),
  constraint "lien_waiver_status_check" check ("status" is null or "status" in ('Pending', 'Received', 'Executed'))
);
alter table public."lien_waiver" enable row level security;

create table if not exists public."margin_history" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "adjusted_cost" numeric,
  "adjusted_revenue" numeric,
  "change_order_id" uuid,
  "job_id" uuid not null,
  "margin_percent" numeric not null,
  "snapshot_reason" text
);
alter table public."margin_history" enable row level security;

create table if not exists public."notification" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "user_id" uuid not null,
  "type" text not null,
  "message" text not null,
  "job_id" uuid,
  "is_read" boolean default false,
  constraint "notification_type_check" check ("type" is null or "type" in ('margin_alert', 'co_pending', 'invoice_overdue'))
);
alter table public."notification" enable row level security;

create table if not exists public."pdf_record" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "change_order_id" uuid not null,
  "file_url" text not null
);
alter table public."pdf_record" enable row level security;

create table if not exists public."proposal" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "client_address" text,
  "client_email" text,
  "client_name" text not null,
  "contract_value" numeric not null,
  "contractor_company" text,
  "contractor_email" text,
  "contractor_license" text,
  "contractor_phone" text,
  "job_id" uuid,
  "job_type" text not null,
  "month_generated" text,
  "payment_terms" text,
  "proposal_content" text,
  "scope_description" text not null,
  "special_notes" text,
  "status" text default 'draft',
  "timeline" text,
  "tone" text default 'professional',
  "user_id" uuid,
  "warranty_terms" text,
  constraint "proposal_status_check" check ("status" is null or "status" in ('draft', 'sent', 'accepted', 'declined')),
  constraint "proposal_tone_check" check ("tone" is null or "tone" in ('professional', 'friendly', 'formal'))
);
alter table public."proposal" enable row level security;

create table if not exists public."selection" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "job_id" uuid not null,
  "job_name" text,
  "category" text,
  "item_name" text not null,
  "allowance_amount" numeric,
  "actual_amount" numeric,
  "client_selection_notes" text,
  "status" text default 'Pending',
  "due_date" date,
  constraint "selection_category_check" check ("category" is null or "category" in ('Flooring', 'Cabinets', 'Countertops', 'Fixtures', 'Paint', 'Appliances', 'Other')),
  constraint "selection_status_check" check ("status" is null or "status" in ('Pending', 'Selected', 'Approved', 'Ordered'))
);
alter table public."selection" enable row level security;

create table if not exists public."seo_article" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "clicks_to_calculator" numeric default 0,
  "content" text,
  "cta_link" text,
  "meta_description" text,
  "primary_keyword" text not null,
  "publish_date" timestamptz,
  "secondary_keywords" jsonb,
  "signups_generated" numeric default 0,
  "slug" text,
  "status" text default 'draft',
  "title" text,
  "views" numeric default 0,
  "word_count" numeric,
  constraint "seo_article_status_check" check ("status" is null or "status" in ('draft', 'published'))
);
alter table public."seo_article" enable row level security;

create table if not exists public."seo_topic" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "article_title" text,
  "keyword" text not null,
  "next_publish_date" timestamptz,
  "seo_article_id" uuid,
  "status" text default 'draft',
  constraint "seo_topic_status_check" check ("status" is null or "status" in ('draft', 'published'))
);
alter table public."seo_topic" enable row level security;

create table if not exists public."subcontractor_po" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "po_number" text,
  "job_id" uuid not null,
  "change_order_id" uuid,
  "vendor_name" text not null,
  "description" text,
  "po_amount" numeric not null,
  "date_issued" date,
  "expected_completion_date" date,
  "acknowledged_date" date,
  "status" text default 'draft',
  constraint "subcontractor_po_status_check" check ("status" is null or "status" in ('draft', 'sent', 'acknowledged', 'completed', 'disputed'))
);
alter table public."subcontractor_po" enable row level security;

create table if not exists public."task" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "job_id" uuid not null,
  "job_name" text,
  "title" text not null,
  "description" text,
  "assigned_to" text,
  "due_date" date,
  "status" text default 'To Do',
  "priority" text default 'Medium',
  constraint "task_status_check" check ("status" is null or "status" in ('To Do', 'In Progress', 'Done')),
  constraint "task_priority_check" check ("priority" is null or "priority" in ('Low', 'Medium', 'High'))
);
alter table public."task" enable row level security;

create table if not exists public."time_entry" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "change_order_id" uuid,
  "date" date not null,
  "description" text,
  "hours" numeric not null,
  "job_id" uuid not null,
  "labor_rate" numeric,
  "worker_name" text
);
alter table public."time_entry" enable row level security;

create table if not exists public."app_user" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "role" text default 'owner',
  "company_name" text,
  "phone" text,
  "trade" text,
  "target_margin_percent" numeric default 30,
  "labor_burden_percent" numeric default 25,
  "default_markup_percent" numeric default 35,
  "default_overhead_percent" numeric default 10,
  "annual_profit_goal" numeric,
  "subscription_status" text default 'trial',
  "subscription_plan" text,
  "stripe_customer_id" text,
  "trial_ends_at" timestamptz,
  constraint "app_user_role_check" check ("role" is null or "role" in ('owner', 'pm', 'admin')),
  constraint "app_user_trade_check" check ("trade" is null or "trade" in ('Roofing', 'Painting', 'Electrical', 'Plumbing', 'HVAC', 'General Carpentry/Remodeling', 'Flooring', 'Landscaping/Hardscape', 'Concrete')),
  constraint "app_user_subscription_status_check" check ("subscription_status" is null or "subscription_status" in ('trial', 'active', 'past_due', 'canceled'))
);
alter table public."app_user" enable row level security;

create table if not exists public."warranty" (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete set null,
  created_by text,
  "job_id" uuid not null,
  "job_name" text,
  "warranty_type" text not null,
  "description" text,
  "start_date" date,
  "end_date" date not null,
  "vendor_responsible" text,
  "notes" text,
  constraint "warranty_warranty_type_check" check ("warranty_type" is null or "warranty_type" in ('Labor', 'Materials', 'Subcontractor'))
);
alter table public."warranty" enable row level security;

-- Foreign keys
alter table public."audit_log" add constraint "audit_log_changed_by_fkey" foreign key ("changed_by") references auth.users(id) on delete set null;
alter table public."change_order" add constraint "change_order_approved_by_fkey" foreign key ("approved_by") references auth.users(id) on delete set null;
alter table public."change_order" add constraint "change_order_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."crew_cost" add constraint "crew_cost_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."daily_log" add constraint "daily_log_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."invoice" add constraint "invoice_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."job" add constraint "job_assigned_user_id_fkey" foreign key ("assigned_user_id") references auth.users(id) on delete set null;
alter table public."job" add constraint "job_user_id_fkey" foreign key ("user_id") references auth.users(id) on delete set null;
alter table public."job_attachment" add constraint "job_attachment_change_order_id_fkey" foreign key ("change_order_id") references public."change_order"(id) on delete cascade;
alter table public."job_attachment" add constraint "job_attachment_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."job_expense" add constraint "job_expense_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."leakage_flag" add constraint "leakage_flag_change_order_id_fkey" foreign key ("change_order_id") references public."change_order"(id) on delete cascade;
alter table public."lien_waiver" add constraint "lien_waiver_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."margin_history" add constraint "margin_history_change_order_id_fkey" foreign key ("change_order_id") references public."change_order"(id) on delete cascade;
alter table public."margin_history" add constraint "margin_history_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."notification" add constraint "notification_user_id_fkey" foreign key ("user_id") references auth.users(id) on delete set null;
alter table public."notification" add constraint "notification_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."pdf_record" add constraint "pdf_record_change_order_id_fkey" foreign key ("change_order_id") references public."change_order"(id) on delete cascade;
alter table public."proposal" add constraint "proposal_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."proposal" add constraint "proposal_user_id_fkey" foreign key ("user_id") references auth.users(id) on delete set null;
alter table public."selection" add constraint "selection_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."seo_topic" add constraint "seo_topic_seo_article_id_fkey" foreign key ("seo_article_id") references public."seo_article"(id) on delete cascade;
alter table public."subcontractor_po" add constraint "subcontractor_po_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."subcontractor_po" add constraint "subcontractor_po_change_order_id_fkey" foreign key ("change_order_id") references public."change_order"(id) on delete cascade;
alter table public."task" add constraint "task_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."time_entry" add constraint "time_entry_change_order_id_fkey" foreign key ("change_order_id") references public."change_order"(id) on delete cascade;
alter table public."time_entry" add constraint "time_entry_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;
alter table public."warranty" add constraint "warranty_job_id_fkey" foreign key ("job_id") references public."job"(id) on delete cascade;