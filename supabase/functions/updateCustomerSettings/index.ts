import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await authMe(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { session_token, ...settings } = body;

    if (!session_token) {
      return Response.json({ error: 'Session token required' }, { status: 401, headers: corsHeaders });
    }

    const customers = await entities.Customer.filter({ session_token });
    if (customers.length === 0) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401, headers: corsHeaders });
    }

    const customer = customers[0];

    if (customer.session_token !== session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    delete settings.password_hash;
    delete settings.session_token;
    delete settings.stripe_customer_id;
    delete settings.subscription_status;

    const allowedFields = [
      'company_name', 'phone', 'trade', 'trade_preset', 'target_margin_percent',
      'labor_burden_percent', 'default_markup_percent',
      'default_overhead_percent', 'workers_comp_percent', 'annual_profit_goal',
      'be_rent_office', 'be_vehicle_equipment', 'be_insurance', 'be_software_tools',
      'be_phone_utilities', 'be_marketing', 'be_salaries_non_field', 'be_other',
      'be_gross_margin_percent', 'be_avg_job_value', 'state', 'base_hourly_wage',
      'payroll_tax_percent', 'general_liability_percent', 'benefits_percent',
      'variance_alert_threshold_percent'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (settings[field] !== undefined) {
        updates[field] = settings[field];
      }
    }

    await entities.Customer.update(customer.id, updates);

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
