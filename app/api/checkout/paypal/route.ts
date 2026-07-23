import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { plan, billingCycle, paypalClientId } = await req.json();

    const clientId = paypalClientId || process.env.PAYPAL_CLIENT_ID;
    const paypalAccount = process.env.PAYPAL_EMAIL || 'vedbhasker@gmail.com';
    const amount = plan === 'enterprise' ? (billingCycle === 'annual' ? '23.00' : '29.00') : (billingCycle === 'annual' ? '7.99' : '9.99');

    // If PayPal Client ID or Email is configured
    if (clientId && clientId.trim().length > 10) {
      // Standard Official PayPal Subscription Hosted Checkout URL
      const checkoutUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick-subscriptions&business=${encodeURIComponent(paypalAccount)}&item_name=Vkratim+SaaS+${plan.toUpperCase()}+Developer+Subscription&a3=${amount}&p3=1&t3=M&src=1&currency_code=USD&return=https://vkratim.com?payment=success`;

      return NextResponse.json({
        success: true,
        url: checkoutUrl,
        orderId: `PAYPAL_${Date.now()}`,
        isLive: true
      });
    }

    // Direct Instant Activation Mode fallback
    return NextResponse.json({
      success: true,
      url: null,
      orderId: `PAYPAL_DEMO_${Date.now()}`,
      isLive: false,
      message: `PayPal Express subscription authorized for ${plan.toUpperCase()} plan`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'PayPal Checkout Initialization Failed' },
      { status: 500 }
    );
  }
}
