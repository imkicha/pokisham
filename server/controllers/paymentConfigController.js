const PaymentConfig = require('../models/PaymentConfig');

// @desc    Get payment config (public - for checkout)
// @route   GET /api/payment-config/active
// @access  Public
exports.getActivePaymentConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.getConfig();

    res.status(200).json({
      success: true,
      onlinePaymentEnabled: config.onlinePaymentEnabled,
      codEnabled: config.codEnabled,
      codCities: config.codCities,
      codAllCities: config.codAllCities,
      codMinOrder: config.codMinOrder,
      codMaxOrder: config.codMaxOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get full payment config (admin)
// @route   GET /api/payment-config
// @access  Private/Admin
exports.getPaymentConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.getConfig();
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payment config
// @route   PUT /api/payment-config
// @access  Private/Admin
exports.updatePaymentConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.getConfig();
    const {
      onlinePaymentEnabled,
      codEnabled,
      codCities,
      codAllCities,
      codMinOrder,
      codMaxOrder,
    } = req.body;

    if (onlinePaymentEnabled !== undefined) config.onlinePaymentEnabled = onlinePaymentEnabled;
    if (codEnabled !== undefined) config.codEnabled = codEnabled;
    if (codCities !== undefined) config.codCities = codCities.map((c) => c.trim().toLowerCase());
    if (codAllCities !== undefined) config.codAllCities = codAllCities;
    if (codMinOrder !== undefined) config.codMinOrder = Number(codMinOrder);
    if (codMaxOrder !== undefined) config.codMaxOrder = Number(codMaxOrder);

    await config.save();

    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
