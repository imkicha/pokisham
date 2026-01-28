const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema(
  {
    onlinePaymentEnabled: {
      type: Boolean,
      default: true,
    },
    codEnabled: {
      type: Boolean,
      default: true,
    },
    codCities: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    codAllCities: {
      type: Boolean,
      default: true,
    },
    codMinOrder: {
      type: Number,
      default: 0,
    },
    codMaxOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Singleton pattern
paymentConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      onlinePaymentEnabled: true,
      codEnabled: true,
      codCities: [],
      codAllCities: true,
      codMinOrder: 0,
      codMaxOrder: 0,
    });
  }
  return config;
};

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
