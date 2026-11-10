const crypto = require('crypto');

const getCloudinaryUploadSignature = (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const folder = process.env.CLOUDINARY_FOLDER || 'rwanda-today';

  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return res.status(503).json({
      success: false,
      message: 'Cloudinary uploads are not configured on this server.',
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp, upload_preset: uploadPreset };
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(signatureBase).digest('hex');

  return res.status(200).json({
    success: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    uploadPreset,
    folder,
  });
};

module.exports = { getCloudinaryUploadSignature };
