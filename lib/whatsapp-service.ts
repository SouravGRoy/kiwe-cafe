// WhatsApp integration utility for sending coupon notifications
// This is an optional feature that can be integrated with WhatsApp Business API

interface WhatsAppMessage {
  to: string;
  type: 'template' | 'text';
  template?: {
    name: string;
    language: { code: string };
    components: any[];
  };
  text?: {
    body: string;
  };
}

interface CouponNotification {
  customerPhone: string;
  couponCode: string;
  couponType: 'WELCOME' | 'LOYALTY' | 'CAMPAIGN';
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  expiryDate: string;
  minimumOrderAmount?: number;
}

export class WhatsAppCouponService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  async sendCouponNotification(notification: CouponNotification): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('WhatsApp credentials not configured - Running in development mode');
        
        // Development mode: Log the message that would be sent
        const message = this.createCouponMessage(notification);
        console.log('📱 WhatsApp Message (Development Mode):');
        console.log(`To: ${message.to}`);
        console.log(`Message: ${message.text?.body}`);
        console.log('─'.repeat(50));
        
        // Simulate successful send
        return true;
      }

      const message = this.createCouponMessage(notification);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('WhatsApp message sent successfully:', result);
        return true;
      } else {
        console.error('Failed to send WhatsApp message:', result);
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  private createCouponMessage(notification: CouponNotification): WhatsAppMessage {
    const discountText = notification.discountType === 'percentage' 
      ? `${notification.discountValue}% off`
      : `₹${notification.discountValue} off`;

    const minimumOrderText = notification.minimumOrderAmount 
      ? ` Minimum order ₹${notification.minimumOrderAmount}.`
      : '';

    const expiryDate = new Date(notification.expiryDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    let messageText = '';

    switch (notification.couponType) {
      case 'WELCOME':
        messageText = `🎉 Welcome to Kiwe Cafe! Here's a special ${discountText} coupon for your first order: *${notification.couponCode}*. Valid till ${expiryDate}.${minimumOrderText} Happy dining! 🍽️`;
        break;
      
      case 'LOYALTY':
        messageText = `🌟 Thank you for being a loyal customer! You've unlocked a ${discountText} coupon: *${notification.couponCode}*. Valid till ${expiryDate}.${minimumOrderText} Enjoy your meal! 🎊`;
        break;
      
      case 'CAMPAIGN':
        messageText = `🎊 Special offer just for you! Get ${discountText} your next order with coupon: *${notification.couponCode}*. Valid till ${expiryDate}.${minimumOrderText} Don't miss out! ⏰`;
        break;
      
      default:
        messageText = `🎁 You've received a ${discountText} coupon: *${notification.couponCode}*. Valid till ${expiryDate}.${minimumOrderText} Enjoy!`;
    }

    return {
      to: notification.customerPhone,
      type: 'text',
      text: {
        body: messageText
      }
    };
  }

  // Alternative: Use WhatsApp template messages (requires pre-approved templates)
  private createTemplateMessage(notification: CouponNotification): WhatsAppMessage {
    return {
      to: notification.customerPhone,
      type: 'template',
      template: {
        name: 'coupon_notification', // This template needs to be pre-approved by WhatsApp
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: notification.couponCode },
              { type: 'text', text: notification.discountType === 'percentage' ? `${notification.discountValue}%` : `₹${notification.discountValue}` },
              { type: 'text', text: new Date(notification.expiryDate).toLocaleDateString('en-IN') }
            ]
          }
        ]
      }
    };
  }
}

// Usage example:
export async function sendWelcomeCoupon(customerPhone: string, couponCode: string, discountValue: number, expiryDate: string) {
  const whatsAppService = new WhatsAppCouponService();
  
  return await whatsAppService.sendCouponNotification({
    customerPhone,
    couponCode,
    couponType: 'WELCOME',
    discountValue,
    discountType: 'percentage',
    expiryDate,
    minimumOrderAmount: 100
  });
}

export async function sendLoyaltyCoupon(customerPhone: string, couponCode: string, discountValue: number, expiryDate: string) {
  const whatsAppService = new WhatsAppCouponService();
  
  return await whatsAppService.sendCouponNotification({
    customerPhone,
    couponCode,
    couponType: 'LOYALTY',
    discountValue,
    discountType: 'fixed',
    expiryDate,
    minimumOrderAmount: 200
  });
}

export async function sendCampaignCoupon(
  customerPhone: string, 
  couponCode: string, 
  discountValue: number, 
  discountType: 'percentage' | 'fixed',
  expiryDate: string,
  minimumOrderAmount?: number
) {
  const whatsAppService = new WhatsAppCouponService();
  
  return await whatsAppService.sendCouponNotification({
    customerPhone,
    couponCode,
    couponType: 'CAMPAIGN',
    discountValue,
    discountType,
    expiryDate,
    minimumOrderAmount
  });
}

/* 
Environment Variables needed in .env.local:
WHATSAPP_ACCESS_TOKEN=your_whatsapp_business_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

To get WhatsApp Business API credentials:
1. Go to Meta for Developers (developers.facebook.com)
2. Create a Business App
3. Add WhatsApp Business Platform
4. Get Phone Number ID and Access Token
5. Set up webhook for message status updates (optional)

Template Message Setup (optional but recommended for production):
1. Create message templates in WhatsApp Business Manager
2. Get them approved by WhatsApp
3. Use template messages instead of text messages for better delivery rates
*/
