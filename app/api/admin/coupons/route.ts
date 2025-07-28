// /app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { WhatsAppCouponService } from '@/lib/whatsapp-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || ''; // 'used', 'unused', 'expired'

    const offset = (page - 1) * limit;

    // Build query for coupons
    let query = supabase
      .from('coupons')
      .select(`
        *,
        coupon_types(name, description),
        orders!coupons_used_in_order_id_fkey(id, total, created_at)
      `, { count: 'exact' });

    // Add search filter
    if (search) {
      query = query.or(`code.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }

    // Add type filter
    if (type) {
      query = query.eq('coupon_types.name', type);
    }

    // Add status filter
    if (status === 'used') {
      query = query.eq('is_used', true);
    } else if (status === 'unused') {
      query = query.eq('is_used', false).gt('expires_at', new Date().toISOString());
    } else if (status === 'expired') {
      query = query.eq('is_used', false).lt('expires_at', new Date().toISOString());
    }

    // Add sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: coupons, error, count } = await query;

    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }

    // Get coupon statistics
    const { data: usedCoupons } = await supabase
      .from('coupons')
      .select('discount_type, discount_value', { count: 'exact' })
      .eq('is_used', true);

    const totalSavingsProvided = usedCoupons?.reduce((sum, coupon) => {
      return sum + parseFloat(coupon.discount_value.toString());
    }, 0) || 0;

    return NextResponse.json({
      coupons,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      totalSavingsProvided,
      totalUsedCoupons: usedCoupons?.length || 0,
    });
  } catch (error) {
    console.error('Error in coupons API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerPhone, 
      discountType, 
      discountValue, 
      minimumOrderAmount = 0,
      maximumDiscountAmount,
      expiresAt,
      sendWhatsApp = false 
    } = body;

    // Validate required fields
    if (!customerPhone || !discountType || !discountValue || !expiresAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get campaign coupon type
    const { data: couponType } = await supabase
      .from('coupon_types')
      .select('id')
      .eq('name', 'CAMPAIGN')
      .single();

    if (!couponType) {
      return NextResponse.json({ error: 'Campaign coupon type not found' }, { status: 400 });
    }

    // Generate unique coupon code
    let couponCode = '';
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Generate 8-character alphanumeric code
      couponCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Check if code already exists
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', couponCode)
        .single();
      
      if (!existingCoupon) {
        break; // Code is unique
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts || !couponCode) {
      return NextResponse.json({ error: 'Failed to generate unique coupon code' }, { status: 500 });
    }

    // Create coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: couponCode,
        type_id: couponType.id,
        customer_phone: customerPhone,
        discount_type: discountType,
        discount_value: discountValue,
        minimum_order_amount: minimumOrderAmount,
        maximum_discount_amount: maximumDiscountAmount,
        expires_at: expiresAt,
        generated_by: 'admin'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }

        // Send WhatsApp notification if requested
    if (sendWhatsApp) {
      try {
        const whatsAppService = new WhatsAppCouponService();
        const sent = await whatsAppService.sendCouponNotification({
          customerPhone,
          couponCode: coupon.code,
          couponType: 'CAMPAIGN',
          discountValue,
          discountType,
          expiryDate: expiresAt,
          minimumOrderAmount
        });

        if (sent) {
          // Update coupon record to mark WhatsApp as sent
          await supabase
            .from('coupons')
            .update({
              whatsapp_sent: true,
              whatsapp_sent_at: new Date().toISOString()
            })
            .eq('id', coupon.id);
          
          console.log(`WhatsApp sent successfully to ${customerPhone}`);
        }
      } catch (error) {
        console.error('Error sending WhatsApp:', error);
        // Don't fail the coupon creation if WhatsApp fails
      }
    }

    return NextResponse.json({ coupon, message: 'Coupon created successfully' });
  } catch (error) {
    console.error('Error in create coupon API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
