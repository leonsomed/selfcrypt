const { encodeQR } = require("qr");
const { decodeQR } = require("qr/decode.js");

function decodeBitmapQRCode(bitmap) {
  const decodedString = decodeQR(bitmap);
  return decodedString;
}

function encodeQRCode(data, isTerminal) {
  let qrcodeBuffer;

  if (isTerminal) {
    qrcodeBuffer = encodeQR(data, "term", {
      ecc: "low",
    });
  } else {
    qrcodeBuffer = encodeQR(data, "gif", {
      ecc: "low",
      scale: 4,
    });
  }
  return qrcodeBuffer;
}

module.exports = {
  encodeQRCode,
  decodeBitmapQRCode,
};
