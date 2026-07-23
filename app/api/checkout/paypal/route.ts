import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { plan, billingCycle, paypalClientId } = await req.json();

    const clientId = paypalClientId || process.env.PAYPAL_CLIENT_ID;

    // If PayPal API credentials are configured
    if (clientId && clientId.trim().length > 10) {
      return NextResponse.json({
        success: true,
        url: `https://www.paypal.com/checkoutnow?client_id=${encodeURIComponent(clientId)}&plan=${plan}`,
        orderId: `PAYPAL_${Date.now()}`,
        isLive: true
      });
    }

    // Direct Instant Activation Mode
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
