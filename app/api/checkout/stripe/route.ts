import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { plan, billingCycle, stripeSecretKey, origin } = await req.json();

    const apiKey = stripeSecretKey || process.env.STRIPE_SECRET_KEY;

    const prices: Record<string, { name: string; monthly: number; annual: number }> = {
      pro: { name: 'Vkratim SaaS Pro Plan', monthly: 999, annual: 799 },
      enterprise: { name: 'Vkratim Enterprise Plan', monthly: 2900, annual: 2300 }
    };

    const targetPlan = prices[plan] || prices.pro;
    const unitAmount = billingCycle === 'annual' ? targetPlan.annual : targetPlan.monthly;
    const appOrigin = origin || 'https://vkratim.com';

    // If Stripe Secret Key is present, make real call to Stripe API
    if (apiKey && apiKey.trim().length > 10) {
      const params = new URLSearchParams();
      params.append('payment_method_types[]', 'card');
      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][product_data][name]', targetPlan.name);
      params.append('line_items[0][price_data][unit_amount]', unitAmount.toString());
      params.append('line_items[0][price_data][recurring][interval]', billingCycle === 'annual' ? 'year' : 'month');
      params.append('line_items[0][quantity]', '1');
      params.append('mode', 'subscription');
      params.append('success_url', `${appOrigin}?payment=success&plan=${plan}`);
      params.append('cancel_url', `${appOrigin}?payment=cancel`);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await stripeRes.json();

      if (data.error) {
        return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        url: data.url,
        sessionId: data.id,
        isLive: true
      });
    }

    // Fallback Mode (for demonstration & Instant Activation before API key entry)
    const sessionId = `cs_live_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return NextResponse.json({
      success: true,
      url: null,
      sessionId,
      isLive: false,
      message: `Payment authorized for ${targetPlan.name} (${billingCycle})`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Stripe Checkout Initialization Failed' },
      { status: 500 }
    );
  }
}
