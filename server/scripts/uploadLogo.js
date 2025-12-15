const cloudinary = require('../config/cloudinary');
const path = require('path');

/**
 * Upload logo to Cloudinary
 * Usage: node scripts/uploadLogo.js <path-to-logo>
 * Example: node scripts/uploadLogo.js ../../client/public/logo192.png
 */

async function uploadLogo() {
  try {
    // Get logo path from command line argument
    const logoPath = process.argv[2];

    if (!logoPath) {
      console.error('Error: Please provide the path to your logo file');
      console.log('Usage: node scripts/uploadLogo.js <path-to-logo>');
      console.log('Example: node scripts/uploadLogo.js ../../client/public/logo192.png');
      process.exit(1);
    }

    // Resolve the full path
    const fullPath = path.resolve(__dirname, logoPath);
    console.log(`Uploading logo from: ${fullPath}`);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: 'pokisham/branding',
      public_id: 'company-logo',
      overwrite: true,
      transformation: [
        { width: 200, height: 200, crop: 'limit' }, // Limit max size
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('\n✅ Logo uploaded successfully!');
    console.log('\nCloudinary URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('\nTo use this logo in your invoice, update the invoiceGenerator.js file:');
    console.log(`\nconst logoUrl = '${result.secure_url}';`);
    console.log(`doc.image(logoUrl, 50, 45, { width: 50 });\n`);

  } catch (error) {
    console.error('❌ Error uploading logo:', error.message);
    process.exit(1);
  }
}

uploadLogo();
