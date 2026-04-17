const QRCode = require('qrcode');

const generateDataUrl = async (payload) => {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
};

module.exports = { generateDataUrl };
