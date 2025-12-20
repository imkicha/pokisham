const PDFDocument = require('pdfkit');

const generateInvoice = (order, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=invoice-${order.orderNumber}.pdf`
  );

  // Pipe the PDF to the response
  doc.pipe(res);

  // Add content to PDF
  generateHeader(doc);
  generateCustomerInformation(doc, order);
  generateInvoiceTable(doc, order);
  generateFooter(doc, order);

  // Finalize the PDF
  doc.end();
};

// Generate invoice as buffer for uploading to Cloudinary
const generateInvoiceBuffer = (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add content to PDF
    generateHeader(doc);
    generateCustomerInformation(doc, order);
    generateInvoiceTable(doc, order);
    generateFooter(doc, order);

    // Finalize the PDF
    doc.end();
  });
};

function generateHeader(doc) {
  // Add logo if URL is provided
  // To use a logo, uncomment the lines below and add your Cloudinary URL:
  // const logoUrl = 'https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/pokisham/branding/company-logo.png';
  // doc.image(logoUrl, 50, 45, { width: 60, height: 60 });
  // Then adjust the text position to the right of the logo:

  const hasLogo = false; // Set to true when you add a logo
  const textX = hasLogo ? 120 : 50; // Position text to the right if logo exists

  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('POKISHAM', textX, 45)
    .fontSize(10)
    .text('Custom Photo Frames & Gifts', textX, 70)
    .text('Email: info@pokisham.com', textX, 85)
    .text('Phone: +91 1234567890', textX, 100)
    .moveDown();
}

function generateCustomerInformation(doc, order) {
  doc.fillColor('#444444').fontSize(20).text('INVOICE', 50, 140);

  generateHr(doc, 165);

  const customerInformationTop = 180;

  // Handle different field names for shipping address
  const shipping = order.shippingAddress || {};
  const customerName = shipping.name || shipping.fullName || 'Customer';
  const addressLine1 = shipping.addressLine1 || shipping.address || '';
  const addressLine2 = shipping.addressLine2 || '';
  const city = shipping.city || '';
  const state = shipping.state || '';
  const pincode = shipping.pincode || shipping.postalCode || '';
  const phone = shipping.phone || '';

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(order.orderNumber, 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(formatDate(new Date(order.createdAt)), 150, customerInformationTop + 15)
    .text('Order Status:', 50, customerInformationTop + 30)
    .text(order.orderStatus, 150, customerInformationTop + 30)

    .font('Helvetica-Bold')
    .text('Bill To:', 300, customerInformationTop)
    .font('Helvetica')
    .text(customerName, 300, customerInformationTop + 15)
    .text(addressLine1, 300, customerInformationTop + 30)
    .text(addressLine2, 300, customerInformationTop + 45)
    .text(`${city}, ${state}`, 300, customerInformationTop + 60)
    .text(pincode, 300, customerInformationTop + 75)
    .text(phone, 300, customerInformationTop + 90)
    .moveDown();

  generateHr(doc, 290);
}

function generateInvoiceTable(doc, order) {
  let i;
  const invoiceTableTop = 310;

  // Table Header
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'Quantity',
    'Unit Price',
    'Total'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Helvetica');

  // Table Rows
  let position = invoiceTableTop + 30;
  for (i = 0; i < order.orderItems.length; i++) {
    const item = order.orderItems[i];
    const itemName = item.variant
      ? `${item.name} (${item.variant.size})`
      : item.name;
    const itemTotal = item.price * item.quantity;

    generateTableRow(
      doc,
      position,
      itemName,
      item.quantity,
      `₹${item.price.toFixed(2)}`,
      `₹${itemTotal.toFixed(2)}`
    );

    if (item.giftWrap) {
      position += 20;
      generateTableRow(
        doc,
        position,
        '  └ Gift Wrap',
        '',
        '',
        '₹50.00'
      );
    }

    generateHr(doc, position + 20);
    position += 30;
  }

  // Summary
  const subtotalPosition = position + 10;
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    '',
    'Subtotal:',
    `₹${order.itemsPrice.toFixed(2)}`
  );

  const shippingPosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    shippingPosition,
    '',
    '',
    'Shipping:',
    `₹${order.shippingPrice.toFixed(2)}`
  );

  if (order.giftWrapPrice > 0) {
    const giftWrapPosition = shippingPosition + 20;
    generateTableRow(
      doc,
      giftWrapPosition,
      '',
      '',
      'Gift Wrap:',
      `₹${order.giftWrapPrice.toFixed(2)}`
    );
  }

  if (order.taxPrice > 0) {
    const taxPosition = shippingPosition + (order.giftWrapPrice > 0 ? 40 : 20);
    generateTableRow(
      doc,
      taxPosition,
      '',
      '',
      'Tax:',
      `₹${order.taxPrice.toFixed(2)}`
    );
  }

  if (order.discountPrice > 0) {
    const discountPosition =
      shippingPosition +
      (order.giftWrapPrice > 0 ? 40 : 20) +
      (order.taxPrice > 0 ? 20 : 0);
    generateTableRow(
      doc,
      discountPosition,
      '',
      '',
      'Discount:',
      `-₹${order.discountPrice.toFixed(2)}`
    );
  }

  const totalPosition =
    shippingPosition +
    (order.giftWrapPrice > 0 ? 40 : 20) +
    (order.taxPrice > 0 ? 20 : 0) +
    (order.discountPrice > 0 ? 20 : 0);

  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    totalPosition,
    '',
    '',
    'Total:',
    `₹${order.totalPrice.toFixed(2)}`
  );
  doc.font('Helvetica');
}

function generateFooter(doc, order) {
  doc
    .fontSize(10)
    .text(
      'Payment Method: ' + order.paymentMethod,
      50,
      700,
      { align: 'center', width: 500 }
    )
    .text('Thank you for your business!', 50, 720, {
      align: 'center',
      width: 500,
    });
}

function generateTableRow(doc, y, item, quantity, unitCost, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y, { width: 250 })
    .text(quantity, 300, y, { width: 50, align: 'right' })
    .text(unitCost, 370, y, { width: 80, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

module.exports = { generateInvoice, generateInvoiceBuffer };
