const { encodeQR } = require("qr");

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
};
