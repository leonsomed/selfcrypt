#!/usr/bin/env node

const fs = require("node:fs/promises");
const readline = require("node:readline");
const Writable = require("node:stream").Writable;
const {
  encrypt,
  decrypt,
  validateBlockFileData,
  parseBlockFileData,
} = require("./crypto");
const { encodeQRCode } = require("./qr");

const optionMap = {
  inputFile: "-i",
  outputFile: "-o",
  decrypt: "-d",
  decryptStdout: "-do",
  qrCode: "-qr",
  help: "-h",
};

const mutedStdout = new Writable({
  write: (chunk, encoding, callback) => {
    callback();
  },
});

async function parseParams() {
  const args = process.argv.slice(2);
  const params = new Map();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case optionMap.decrypt:
        params.set(optionMap.decrypt, true);
        break;
      case optionMap.decryptStdout:
        params.set(optionMap.decrypt, true);
        params.set(optionMap.decryptStdout, true);
        break;
      case optionMap.inputFile: {
        i += 1;
        const value = args[i].trim();

        if (!value) {
          console.error(`Missing value for option ${optionMap.inputFile}`);
          process.exit(1);
        }

        params.set(optionMap.inputFile, value);
        break;
      }
      case optionMap.outputFile: {
        i += 1;
        const value = args[i].trim();

        if (!value) {
          console.error(`Missing value for option ${optionMap.outputFile}`);
          process.exit(1);
        }

        params.set(optionMap.outputFile, value);
        break;
      }
      case optionMap.qrCode: {
        params.set(optionMap.qrCode, true);
        break;
      }
      case optionMap.help: {
        params.set(optionMap.help, true);
        break;
      }
    }
  }

  if (
    !params.has(optionMap.decryptStdout) &&
    params.has(optionMap.inputFile) &&
    !params.has(optionMap.outputFile)
  ) {
    const inputFile = params.get(optionMap.inputFile);
    params.set(
      optionMap.outputFile,
      params.has(optionMap.decrypt)
        ? inputFile.substring(0, inputFile.length - 5)
        : inputFile + ".json",
    );
  }

  if (
    params.has(optionMap.help) ||
    (!params.has(optionMap.inputFile) && !params.has(optionMap.outputFile))
  ) {
    console.log(params);
    const text = await fs.readFile(__dirname + "/../README.md", "utf-8");
    console.log(text);
    process.exit(1);
  }

  return params;
}

async function getPassphraseFromStdin(confirm, sufix) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: mutedStdout,
    terminal: true,
  });
  console.log(`Enter a passphrase ${sufix}:`);
  let passphrase;

  for await (const line of rl) {
    if (!passphrase) {
      passphrase = line;
      if (!confirm) {
        rl.close();
        break;
      }
      console.log("Confirm the passphrase:");
    } else if (passphrase !== line) {
      console.log("Passphrases missmatch, aborting");
      rl.close();
      throw new Error("PASSPHRASE_MISSMATCH");
    } else {
      rl.close();
      break;
    }
  }

  const KEY = Buffer.from(passphrase);

  return KEY;
}

async function validateFiles(
  inputFile,
  outputFile,
  isDecrypt,
  isDecryptStdout,
) {
  if (!isDecryptStdout) {
    const outputFileStats = await fs.stat(outputFile).catch((e) => {
      if (e?.code === "ENOENT") {
        return null;
      }
      throw e;
    });

    if (outputFileStats) {
      console.error("Output file already exists, provide a different path");
      process.exit(1);
    }
  }

  if (inputFile) {
    const inputDataBuffer = await fs.readFile(inputFile).catch((e) => {
      if (e?.code === "ENOENT") {
        console.error("Input file doesn't exist, provide a valid path");
        process.exit(1);
      }
      throw e;
    });

    if (isDecrypt && !validateBlockFileData(inputDataBuffer)) {
      console.error("Input file is not an encrypted block");
      process.exit(1);
    }

    return inputDataBuffer;
  }

  // get inline input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  console.log("Enter content and press Ctrl + D when done:");
  let content = [];

  for await (const line of rl) {
    content.push(Buffer.from(line + "\n", "utf8"));
  }

  return Buffer.concat(content);
}

async function run() {
  const params = await parseParams();
  const isDecrypt = params.has(optionMap.decrypt);
  const isDecryptStdout = params.has(optionMap.decryptStdout);
  const isQRCode = params.has(optionMap.qrCode);
  const inputFile = params.get(optionMap.inputFile);
  const outputFile = params.get(optionMap.outputFile);

  const inputDataBuffer = await validateFiles(
    inputFile,
    outputFile,
    isDecrypt,
    isDecryptStdout,
  );

  if (isDecrypt) {
    const passphrase = await getPassphraseFromStdin(false, " to decrypt");
    const block = parseBlockFileData(inputDataBuffer);
    const decrypted = await decrypt(block, passphrase);
    const result = decrypted.toString();

    if (isDecryptStdout) {
      console.log(result);
    } else {
      await fs.writeFile(outputFile, decrypted);
    }

    if (isQRCode) {
      const output = encodeQRCode(result, false);
      const filename = (outputFile ?? inputFile) + ".decrypted.gif";
      await fs.writeFile(filename, output);
      console.log("QR Code decrypted file generated at " + filename);
    }

    console.log("Completed!");
  } else {
    const passphrase = await getPassphraseFromStdin(true, " to encrypt");
    const block = await encrypt(inputDataBuffer, passphrase);
    const decrypted = await decrypt(block, passphrase);

    if (Buffer.compare(inputDataBuffer, decrypted) !== 0) {
      console.error("There was a problem, please try again");
      process.exit(1);
    }

    const json = JSON.stringify(block);
    await fs.writeFile(outputFile, json);

    if (isQRCode) {
      const output = encodeQRCode(json, false);
      const filename = outputFile + ".encrypted.gif";
      await fs.writeFile(filename, output);
      console.log("QR Code encrypted file generated at " + filename);
    }

    console.log("Completed!");
  }
}

run();
