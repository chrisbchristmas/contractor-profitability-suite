import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response("Webhook Error", { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email || session.customer_email;
      const plan = session.metadata?.plan;

      if (userEmail) {
        // Update Customer entity (primary — SubscriptionGate reads from here)
        const customers = await base44.asServiceRole.entities.Customer.filter({ email: userEmail });
        if (customers.length > 0) {
          await base44.asServiceRole.entities.Customer.update(customers[0].id, {
            subscription_status: "active",
            subscription_plan: plan,
            stripe_customer_id: session.customer,
          });
          console.log(`[Customer] Activated subscription for ${userEmail}, plan: ${plan}`);
        }

        // Also update Platform User entity (admin/backoffice)
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: "active",
            subscription_plan: plan,
            stripe_customer_id: session.customer,
          });
          console.log(`[User] Activated subscription for ${userEmail}, plan: ${plan}`);
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer);
      const email = customer.email;
      const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status;

      if (email) {
        // Update Customer entity
        const customers = await base44.asServiceRole.entities.Customer.filter({ email });
        if (customers.length > 0) {
          await base44.asServiceRole.entities.Customer.update(customers[0].id, {
            subscription_status: status,
          });
          console.log(`[Customer] Updated subscription status for ${email}: ${status}`);
        }

        // Also update Platform User entity
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: status,
          });
          console.log(`[User] Updated subscription status for ${email}: ${status}`);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer);
      const email = customer.email;

      if (email) {
        // Update Customer entity
        const customers = await base44.asServiceRole.entities.Customer.filter({ email });
        if (customers.length > 0) {
          await base44.asServiceRole.entities.Customer.update(customers[0].id, {
            subscription_status: "canceled",
          });
          console.log(`[Customer] Canceled subscription for ${email}`);
        }

        // Also update Platform User entity
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: "canceled",
          });
          console.log(`[User] Canceled subscription for ${email}`);
        }
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err.message);
  }

  return Response.json({ received: true });
});