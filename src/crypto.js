const crypto = require("node:crypto");
const argon2 = require("argon2");

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const LATEST_VERSION = "2";

async function argon2Native(passphrase, salt) {
  return await new Promise((resolve, reject) => {
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

async function argon2Module(passphrase, salt) {
  return await argon2.hash(passphrase, {
    type: argon2.argon2d,
    memoryCost: 65536,
    parallelism: 2,
    timeCost: 10,
    salt: Buffer.from(salt),
    hashLength: 32,
    raw: true,
  });
}

async function argon2KDF(passphrase, salt, useNativeArgon2) {
  return useNativeArgon2
    ? argon2Native(passphrase, salt)
    : argon2Module(passphrase, salt);
}

async function getKey({ passphrase, salt, version, useNativeArgon2 }) {
  switch (version) {
    case "1":
      const keyHex = crypto.hash("sha256", Buffer.concat([passphrase, salt]));
      return Buffer.from(keyHex, "hex");
    case "2":
      return await argon2KDF(passphrase, salt, useNativeArgon2);
    default:
      throw new Error(`block version "${version}" not implemented`);
  }
}

async function encrypt(data, passphrase, version, useNativeArgon2) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = await getKey({ passphrase, salt, version, useNativeArgon2 });
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

async function decrypt(block, passphrase, useNativeArgon2) {
  const iv = Buffer.from(block.iv, "base64");
  const salt = Buffer.from(block.salt, "base64");
  const data = Buffer.from(block.data, "base64");
  const version = block.v ?? "1"; // if v is not present assume it is v1

  if (version !== LATEST_VERSION) {
    console.warn(
      `WARNING: block with version ${version} and the latest version is ${LATEST_VERSION}`,
    );
  }

  const key = await getKey({ passphrase, salt, version, useNativeArgon2 });

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(data);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

function validateBlockFileData(rawStr) {
  try {
    const block = parseBlockFileData(rawStr);

    if (!block.iv || !block.salt || !block.data) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function parseBlockFileData(rawStr) {
  return JSON.parse(rawStr);
}

module.exports = {
  parseBlockFileData,
  validateBlockFileData,
  encrypt,
  decrypt,
  LATEST_VERSION,
};
