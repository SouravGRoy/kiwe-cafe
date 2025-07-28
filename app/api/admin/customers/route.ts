// /app/api/admin/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'last_order_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query for customers with search
    let query = supabase
      .from('customer_analytics')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (search) {
      query = query.or(`phone.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Get total unique customers count
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Get customer statistics
    const { data: stats } = await supabase
      .from('customer_analytics')
      .select('customer_tier')
      .then(({ data }) => {
        const tierStats = data?.reduce((acc: any, customer) => {
          acc[customer.customer_tier] = (acc[customer.customer_tier] || 0) + 1;
          return acc;
        }, {}) || {};

        return { data: tierStats };
      });

    return NextResponse.json({
      customers,
      totalCustomers: totalCustomers || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      stats: stats || {},
    });
  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
