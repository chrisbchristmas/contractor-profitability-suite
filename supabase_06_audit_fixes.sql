-- supabase_06_audit_fixes.sql — Nov 2026 audit
-- 1. Uploads were impossible: storage.objects had RLS on and zero policies.
drop policy if exists "attachments_insert_authenticated" on storage.objects;
create policy "attachments_insert_authenticated" on storage.objects
  for insert to authenticated with check (bucket_id = 'attachments');

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array[
         'image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
         'application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
 where id = 'attachments';

-- 2. Trigger-only SECURITY DEFINER functions should not be callable through the REST API.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.prosecdef
             and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- 3. Mutable search_path warning.
do $$ begin
  if exists (select 1 from pg_proc where proname = 'touch_updated_date' and pronamespace = 'public'::regnamespace) then
    execute 'alter function public.touch_updated_date() set search_path = public';
  end if;
end $$;
