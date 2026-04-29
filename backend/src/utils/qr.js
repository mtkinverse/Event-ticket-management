import QRCode from 'qrcode';

export const qr = {
  generate: (text) => QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 256 }),
};
