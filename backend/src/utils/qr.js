import QRCode from 'qrcode';

export const generateQR = (data) =>
  QRCode.toDataURL(JSON.stringify(data));
