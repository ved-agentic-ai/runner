import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { plan, billingCycle } = await req.json();

    const orderId = `PAYPAL_ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return NextResponse.json({
      success: true,
      url: `https://www.paypal.com/checkoutnow?token=${orderId}&plan=${plan}`,
      orderId,
      message: `PayPal Express order initialized for ${plan.toUpperCase()} plan`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'PayPal Checkout Initialization Failed' },
      { status: 500 }
    );
  }
}
