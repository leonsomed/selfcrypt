const crypto = require("node:crypto");

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const LATEST_VERSION = "2";

async function argon2(passphrase, salt) {
  return new Promise((resolve, reject) => {
    crypto.argon2(
      "argon2d",
      {
        memory: 65536,
        parallelism: 2,
        passes: 10,
        message: passphrase,
        nonce: salt,
        tagLength: 32,
      },
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data);
      },
    );
  });
}

async function getKey({ passphrase, salt, version }) {
  switch (version) {
    case "1":
      const keyHex = crypto.hash("sha256", Buffer.concat([passphrase, salt]));
      return Buffer.from(keyHex, "hex");
    case "2":
      return await argon2(passphrase, salt);
    default:
      throw new Error(`block version "${version}" not implemented`);
  }
}

async function encrypt(data, passphrase, version = LATEST_VERSION) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = await getKey({ passphrase, salt, version });
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return {
    v: version,
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

async function decrypt(block, passphrase) {
  const iv = Buffer.from(block.iv, "base64");
  const salt = Buffer.from(block.salt, "base64");
  const data = Buffer.from(block.data, "base64");
  const version = block.v ?? "1"; // if v is not present assume it is v1

  if (version !== LATEST_VERSION) {
    console.warn(
      `WARNING: block with version ${version} and the latest version is ${LATEST_VERSION}`,
    );
  }

  const key = await getKey({ passphrase, salt, version });

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
