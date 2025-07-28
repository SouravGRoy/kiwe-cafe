// /app/api/coupons/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, customerPhone, orderTotal } = body;

    // Validate required fields
    if (!couponCode || !customerPhone || !orderTotal) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        isValid: false 
      }, { status: 400 });
    }

    // Use database function to validate coupon
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_coupon_code: couponCode.toUpperCase(),
      p_customer_phone: customerPhone,
      p_order_total: orderTotal
    });

    if (error) {
      console.error('Error validating coupon:', error);
      return NextResponse.json({ 
        error: 'Failed to validate coupon',
        isValid: false 
      }, { status: 500 });
    }

    const result = data[0];
    
    if (!result.is_valid) {
      return NextResponse.json({
        isValid: false,
        error: result.error_message,
        discountAmount: 0
      });
    }

    return NextResponse.json({
      isValid: true,
      discountAmount: result.discount_amount,
      couponId: result.coupon_id,
      finalTotal: orderTotal - result.discount_amount
    });

  } catch (error) {
    console.error('Error in coupon validation API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      isValid: false 
    }, { status: 500 });
  }
}
