const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send contact reply email
exports.sendContactReply = async (to, customerName, subject, message, originalMessage) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `Pokisham <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec5578 0%, #f97316 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Pokisham</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Thank you for contacting us!</p>
          </div>
          <div style="padding: 30px; background: #ffffff;">
            <p style="color: #333; font-size: 16px;">Dear ${customerName},</p>
            <div style="color: #333; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="padding: 20px 30px; background: #f5f5f5; border-left: 4px solid #ec5578;">
            <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;"><strong>Your original message:</strong></p>
            <p style="color: #888; font-size: 13px; margin: 0; font-style: italic;">${originalMessage}</p>
          </div>

          <div style="padding: 30px; background: #ffffff;">
            <p style="color: #666; font-size: 14px;">If you have any more questions, feel free to reply to this email.</p>
            <p style="color: #333; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              <strong>Pokisham Team</strong>
            </p>
          </div>

          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0 0 10px 0; font-size: 12px;">© 2026 Pokisham. All rights reserved.</p>
            <p style="color: #999; margin: 0; font-size: 12px;">
              <a href="https://pokisham.com" style="color: #ec5578; text-decoration: none;">Visit our website</a>
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact reply email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact reply:', error);
    throw error;
  }
};

// Generic email sender
exports.sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `Pokisham <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send order confirmation email
exports.sendOrderConfirmation = async (to, customerName, order) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    // Format order items for email
    const orderItemsHtml = order.orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong>
            ${item.variant ? `<br><span style="color: #666; font-size: 13px;">Size: ${item.variant.size}</span>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const mailOptions = {
      from: `Pokisham <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Order Confirmed - ${order.orderNumber} | Pokisham`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ec5578 0%, #f97316 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Pokisham</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Order Confirmation</p>
          </div>

          <!-- Success Message -->
          <div style="padding: 30px; text-align: center; background: #f0fdf4;">
            <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
              <span style="color: white; font-size: 30px;">✓</span>
            </div>
            <h2 style="color: #16a34a; margin: 0 0 10px 0;">Your Order is Confirmed!</h2>
            <p style="color: #666; margin: 0;">Thank you for shopping with us, ${customerName}!</p>
          </div>

          <!-- Order Details -->
          <div style="padding: 30px;">
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #666;">Order Number:</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #ec5578;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;">Order Date:</td>
                  <td style="padding: 5px 0; text-align: right;">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;">Payment Method:</td>
                  <td style="padding: 5px 0; text-align: right;">${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'razorpay' ? 'Online Payment' : order.paymentMethod}</td>
                </tr>
              </table>
            </div>

            <!-- Order Items -->
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <!-- Price Summary -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Subtotal:</td>
                  <td style="padding: 8px 0; text-align: right;">₹${order.itemsPrice.toFixed(2)}</td>
                </tr>
                ${order.taxPrice > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tax:</td>
                  <td style="padding: 8px 0; text-align: right;">₹${order.taxPrice.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;">Shipping:</td>
                  <td style="padding: 8px 0; text-align: right;">${order.shippingPrice > 0 ? '₹' + order.shippingPrice.toFixed(2) : 'FREE'}</td>
                </tr>
                ${order.giftWrapPrice > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Gift Wrap:</td>
                  <td style="padding: 8px 0; text-align: right;">₹${order.giftWrapPrice.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${order.discountPrice > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #22c55e;">Discount:</td>
                  <td style="padding: 8px 0; text-align: right; color: #22c55e;">-₹${order.discountPrice.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #333;">Total:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #ec5578;">₹${order.totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Shipping Address -->
            <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 18px;">Shipping Address</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
              <p style="margin: 0; color: #333; line-height: 1.6;">
                <strong>${order.shippingAddress.name || order.shippingAddress.fullName || ''}</strong><br>
                ${order.shippingAddress.addressLine1 || order.shippingAddress.address || ''}<br>
                ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>
          </div>

          <!-- What's Next -->
          <div style="padding: 0 30px 30px;">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">What's Next?</h4>
              <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                We're preparing your order with love and care! You'll receive another email once your order is shipped with tracking details.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #333; padding: 25px; text-align: center;">
            <p style="color: #fff; margin: 0 0 10px 0; font-size: 14px;">Need help? Contact us anytime!</p>
            <p style="color: #999; margin: 0 0 15px 0; font-size: 13px;">
              <a href="mailto:support@pokisham.com" style="color: #ec5578; text-decoration: none;">support@pokisham.com</a>
            </p>
            <p style="color: #666; margin: 0; font-size: 12px;">© 2024 Pokisham. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Don't throw - we don't want order creation to fail if email fails
    return { success: false, error: error.message };
  }
};

// Order status templates
const orderStatusTemplates = {
  Processing: {
    subject: 'Your Order is Being Processed - {{orderNumber}}',
    emoji: '⚙️',
    color: '#3b82f6',
    title: 'Order Processing',
    message: 'Great news! We have started processing your order. Our team is carefully preparing your items.',
    whatsapp: '⚙️ *Order Update - Processing*\n\nHi {{customerName}},\n\nYour order *{{orderNumber}}* is now being processed!\n\nWe\'re carefully preparing your items with love. You\'ll receive another update once it\'s shipped.\n\nTotal: ₹{{totalPrice}}\n\nThank you for shopping with Pokisham! 🛍️',
  },
  Shipped: {
    subject: 'Your Order Has Been Shipped - {{orderNumber}}',
    emoji: '🚚',
    color: '#8b5cf6',
    title: 'Order Shipped!',
    message: 'Exciting news! Your order has been shipped and is on its way to you. You can track your package using the tracking details below.',
    whatsapp: '🚚 *Order Update - Shipped*\n\nHi {{customerName}},\n\nYour order *{{orderNumber}}* has been shipped!\n\n📦 Your package is on the way!\n{{trackingInfo}}\n\nTotal: ₹{{totalPrice}}\n\nThank you for shopping with Pokisham! 🛍️',
  },
  Delivered: {
    subject: 'Your Order Has Been Delivered - {{orderNumber}}',
    emoji: '✅',
    color: '#22c55e',
    title: 'Order Delivered!',
    message: 'Your order has been successfully delivered! We hope you love your purchase. Please share your feedback with us.',
    whatsapp: '✅ *Order Update - Delivered*\n\nHi {{customerName}},\n\nYour order *{{orderNumber}}* has been delivered!\n\n🎉 We hope you love your purchase!\n\nIf you have any questions or feedback, please let us know.\n\nThank you for shopping with Pokisham! 🛍️',
  },
  Cancelled: {
    subject: 'Your Order Has Been Cancelled - {{orderNumber}}',
    emoji: '❌',
    color: '#ef4444',
    title: 'Order Cancelled',
    message: 'Your order has been cancelled as per your request. If you did not request this cancellation, please contact us immediately.',
    whatsapp: '❌ *Order Update - Cancelled*\n\nHi {{customerName}},\n\nYour order *{{orderNumber}}* has been cancelled.\n\nIf you did not request this, please contact us immediately.\n\nWe hope to serve you again soon!\n\nTeam Pokisham 🛍️',
  },
  Refunded: {
    subject: 'Your Order Refund Processed - {{orderNumber}}',
    emoji: '💰',
    color: '#f59e0b',
    title: 'Refund Processed',
    message: 'Your refund has been processed successfully. The amount will be credited to your original payment method within 5-7 business days.',
    whatsapp: '💰 *Order Update - Refunded*\n\nHi {{customerName}},\n\nYour refund for order *{{orderNumber}}* has been processed!\n\n💳 Amount: ₹{{totalPrice}}\n\nThe refund will be credited to your original payment method within 5-7 business days.\n\nTeam Pokisham 🛍️',
  },
};

// Get order status templates
exports.getOrderStatusTemplates = () => {
  return Object.keys(orderStatusTemplates).map(status => ({
    status,
    ...orderStatusTemplates[status],
  }));
};

// Send order status update email
exports.sendOrderStatusEmail = async (to, customerName, order, status, trackingNumber = '') => {
  try {
    const template = orderStatusTemplates[status];
    if (!template) {
      throw new Error(`No template found for status: ${status}`);
    }

    const transporter = createTransporter();
    await transporter.verify();

    const trackingHtml = trackingNumber ? `
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #0369a1; font-size: 14px;">
          <strong>📦 Tracking Number:</strong> ${trackingNumber}
        </p>
      </div>
    ` : '';

    const mailOptions = {
      from: `Pokisham <${process.env.EMAIL_USER}>`,
      to: to,
      subject: template.subject.replace('{{orderNumber}}', order.orderNumber),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ec5578 0%, #f97316 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Pokisham</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Order Status Update</p>
          </div>

          <!-- Status Message -->
          <div style="padding: 30px; text-align: center;">
            <div style="width: 80px; height: 80px; background: ${template.color}; border-radius: 50%; margin: 0 auto 20px; line-height: 80px;">
              <span style="font-size: 40px;">${template.emoji}</span>
            </div>
            <h2 style="color: ${template.color}; margin: 0 0 15px 0; font-size: 24px;">${template.title}</h2>
            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.6;">${template.message}</p>
            ${trackingHtml}
          </div>

          <!-- Order Details -->
          <div style="padding: 0 30px 30px;">
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Order Number:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ec5578;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Order Date:</td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: ${template.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${status}</span>
                  </td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0 8px 0; font-weight: bold; color: #333;">Total:</td>
                  <td style="padding: 12px 0 8px 0; text-align: right; font-weight: bold; color: #ec5578; font-size: 18px;">₹${order.totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="padding: 0 30px 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Delivery Address</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                ${order.shippingAddress.name || order.shippingAddress.fullName || ''}<br>
                ${order.shippingAddress.addressLine1 || order.shippingAddress.address || ''}<br>
                ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
              </p>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="padding: 0 30px 30px; text-align: center;">
            <a href="https://www.pokisham.com/orders/${order._id}"
               style="display: inline-block; background: linear-gradient(135deg, #ec5578 0%, #f97316 100%); color: white; padding: 14px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
              View Order Details
            </a>
          </div>

          <!-- Footer -->
          <div style="background: #333; padding: 25px; text-align: center;">
            <p style="color: #fff; margin: 0 0 10px 0; font-size: 14px;">Questions about your order?</p>
            <p style="color: #999; margin: 0 0 15px 0; font-size: 13px;">
              <a href="mailto:support@pokisham.com" style="color: #ec5578; text-decoration: none;">support@pokisham.com</a>
            </p>
            <p style="color: #666; margin: 0; font-size: 12px;">© 2024 Pokisham. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order status email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order status email:', error);
    return { success: false, error: error.message };
  }
};

// Get WhatsApp message for order status
exports.getWhatsAppMessage = (customerName, order, status, trackingNumber = '') => {
  const template = orderStatusTemplates[status];
  if (!template) {
    return null;
  }

  let message = template.whatsapp
    .replace(/\{\{customerName\}\}/g, customerName)
    .replace(/\{\{orderNumber\}\}/g, order.orderNumber)
    .replace(/\{\{totalPrice\}\}/g, Math.round(order.totalPrice));

  if (trackingNumber) {
    message = message.replace('{{trackingInfo}}', `📦 Tracking: ${trackingNumber}`);
  } else {
    message = message.replace('{{trackingInfo}}', '');
  }

  return message;
};
