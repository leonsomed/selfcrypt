const crypto = require("node:crypto");

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const SALT_LENGTH = 16;

async function encrypt(data, passphrase) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const keyHex = crypto.hash("sha256", Buffer.concat([passphrase, salt]));
  const key = Buffer.from(keyHex, "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return {
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

async function decrypt(block, passphrase) {
  const iv = Buffer.from(block.iv, "base64");
  const salt = Buffer.from(block.salt, "base64");
  const data = Buffer.from(block.data, "base64");
  const keyHex = crypto.hash("sha256", Buffer.concat([passphrase, salt]));
  const key = Buffer.from(keyHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(data);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

function validateBlockFileData(buffer) {
  try {
    const block = parseBlockFileData(buffer);

    if (!block.iv || !block.salt || !block.data) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function parseBlockFileData(buffer) {
  return JSON.parse(buffer.toString());
}

module.exports = {
  parseBlockFileData,
  validateBlockFileData,
  encrypt,
  decrypt,
};
