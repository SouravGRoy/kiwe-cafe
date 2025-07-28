# WhatsApp Business API Setup Guide

## 🚀 Quick Setup (15 minutes)

### Step 1: Create Meta Developer Account

1. Visit: https://developers.facebook.com
2. Click "Get Started" → Create account
3. Verify phone number and email

### Step 2: Create WhatsApp Business App

1. **Create App** → Select "Business" → Name it "Kiwe Cafe Notifications"
2. **Add Product** → Search "WhatsApp" → Click "Set up"
3. **Get Started** → Note down these credentials:

```
Phone Number ID: 123456789012345 (copy this)
Access Token: EAAxxxxxx... (temporary - copy this)
App ID: 987654321 (copy this)
```

### Step 3: Add Environment Variables

Create `.env.local` file in your project root:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=EAAxxxxxx_your_token_here
WHATSAPP_PHONE_NUMBER_ID=123456789012345_your_id_here
```

### Step 4: Test Setup

1. **Create a coupon** in admin dashboard with "Send via WhatsApp" checked
2. **Check console logs** - you should see detailed WhatsApp message
3. **For actual sending**: Add test phone numbers in Meta Developer Console

## 📋 Detailed Setup Instructions

### A. Get Permanent Access Token (Recommended)

1. Go to **Business Settings** in Meta Business Manager
2. **System Users** → Create system user for your app
3. **Generate Token** → Select your app → Add `whatsapp_business_messaging` permission
4. **Copy the permanent token** (doesn't expire)

### B. Add Test Phone Numbers (Development)

1. In **WhatsApp** → **API Setup** → **Recipients**
2. **Add recipient** → Enter phone numbers (including country code)
3. **Verify** via SMS code
4. Now you can send test messages to these numbers

### C. Production Setup (Optional)

1. **App Review** → Submit for WhatsApp Business approval
2. **Provide business documents** and use case description
3. **Once approved** → Can send to any phone number globally

## 🧪 Testing Your Setup

### Test 1: Check Credentials

```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_TEST_PHONE_NUMBER",
    "type": "text",
    "text": {
      "body": "Hello from Kiwe Cafe! 🍽️"
    }
  }'
```

### Test 2: Create Coupon with WhatsApp

1. Go to **Admin Dashboard** → **Coupons**
2. **Create Coupon** → Check ✅ "Send via WhatsApp"
3. **Check logs** for WhatsApp message details

## 💡 Quick Start (No Setup Required)

Your app already works in **development mode**!

- Creates coupons ✅
- Shows WhatsApp messages in console ✅
- Tracks WhatsApp send status ✅

To see actual WhatsApp messages, just add the environment variables above.

## 🔧 Troubleshooting

### Common Issues:

1. **"WhatsApp credentials not configured"** → Add `.env.local` file
2. **"Invalid phone number"** → Use format: +919876543210 (include country code)
3. **"Token expired"** → Create permanent token via System User

### Support:

- Meta WhatsApp Docs: https://developers.facebook.com/docs/whatsapp
- Test your setup in Meta Developer Console
- Check console logs for detailed error messages

## 🎉 You're Ready!

Once environment variables are added:

1. **Create coupons** → Customers get WhatsApp notifications
2. **Automatic welcome** coupons sent to new customers
3. **Loyalty rewards** sent to repeat customers
4. **Campaign promotions** sent instantly

**Total setup time: ~15 minutes** ⚡
