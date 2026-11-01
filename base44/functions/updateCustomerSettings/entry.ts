import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_token, ...settings } = body;

    if (!session_token) {
      return Response.json({ error: 'Session token required' }, { status: 401 });
    }

    // Find customer by session token
    const customers = await base44.asServiceRole.entities.Customer.filter({ session_token });
    if (customers.length === 0) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const customer = customers[0];

    // Verify the provided token exactly matches the stored token
    if (customer.session_token !== session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Strip sensitive fields from input regardless of what was passed
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

    await base44.asServiceRole.entities.Customer.update(customer.id, updates);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});