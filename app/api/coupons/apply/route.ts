// /app/api/coupons/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponId, orderId } = body;

    // Validate required fields
    if (!couponId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mark coupon as used
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_in_order_id: orderId
      })
      .eq('id', couponId)
      .eq('is_used', false) // Ensure it wasn't already used
      .select()
      .single();

    if (couponError || !coupon) {
      console.error('Error applying coupon:', couponError);
      return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 });
    }

    // Get order details for usage history
    const { data: order } = await supabase
      .from('orders')
      .select('original_total, total, customer_phone')
      .eq('id', orderId)
      .single();

    if (order) {
      // Create usage history record
      await supabase
        .from('coupon_usage_history')
        .insert({
          coupon_id: couponId,
          order_id: orderId,
          customer_phone: order.customer_phone,
          discount_applied: order.original_total - order.total,
          original_total: order.original_total,
          final_total: order.total
        });
    }

    return NextResponse.json({ 
      message: 'Coupon applied successfully',
      coupon: coupon
    });

  } catch (error) {
    console.error('Error in apply coupon API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
