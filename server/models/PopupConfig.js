const mongoose = require('mongoose');

const popupConfigSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: true,
    },
    posters: [
      {
        image: { type: String, required: true },
        imagePublicId: { type: String, default: '' },
        title: { type: String, default: '' },
        link: { type: String, default: '/offers' },
        order: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Singleton pattern - only one config
popupConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ isActive: false, posters: [] });
  }
  return config;
};

module.exports = mongoose.model('PopupConfig', popupConfigSchema);
