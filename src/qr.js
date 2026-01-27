const { encodeQR } = require("qr");

function encodeQRCode(data, isTerminal) {
  let qrcodeBuffer;

  if (isTerminal) {
    qrcodeBuffer = encodeQR(JSON.stringify(data), "term", {
      ecc: "low",
    });
  } else {
    qrcodeBuffer = encodeQR(JSON.stringify(data), "gif", {
      ecc: "low",
      scale: 4,
    });
  }
  return qrcodeBuffer;
}

module.exports = {
  encodeQRCode,
};
