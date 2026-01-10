#!/usr/bin/env node

const fs = require("node:fs/promises");
const {
  encrypt,
  decrypt,
  getPassphraseFromStdin,
  validateBlockFileData,
  parseBlockFileData,
} = require("./crypto");

const optionMap = {
  inputFile: "-i",
  outputFile: "-o",
  decrypt: "-d",
};

function parseParams() {
  const args = process.argv.slice(2);
  const params = new Map();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case optionMap.decrypt:
        params.set(optionMap.decrypt, true);
        break;
      case optionMap.inputFile: {
        i += 1;
        const value = args[i].trim();

        if (!value) {
          throw new Error(`Missing value for option ${optionMap.inputFile}`);
        }

        params.set(optionMap.inputFile, value);
        break;
      }
      case optionMap.outputFile: {
        i += 1;
        const value = args[i].trim();

        if (!value) {
          throw new Error(`Missing value for option ${optionMap.outputFile}`);
        }

        params.set(optionMap.outputFile, value);
        break;
      }
    }
  }

  if (!params.has(optionMap.inputFile)) {
    throw new Error("Required option -i");
  }

  if (!params.has(optionMap.outputFile)) {
    const inputFile = params.get(optionMap.inputFile);
    params.set(
      optionMap.outputFile,
      params.has(optionMap.decrypt)
        ? inputFile.substring(0, inputFile.length - 5)
        : inputFile + ".json",
    );
  }

  return params;
}

async function validateFiles(inputFile, outputFile, isDecrypt) {
  const [inputDataBuffer, outputFileStats] = await Promise.all([
    fs.readFile(inputFile).catch((e) => {
      if (e?.code === "ENOENT") {
        console.error("Input file doesn't exist, provide a valid path");
        process.exit(1);
      }
      throw e;
    }),
    fs.stat(outputFile).catch((e) => {
      if (e?.code === "ENOENT") {
        return null;
      }
      throw e;
    }),
  ]);

  if (outputFileStats) {
    console.error("Output file already exists, provide a different path");
    process.exit(1);
  }

  if (isDecrypt && !validateBlockFileData(inputDataBuffer)) {
    console.error("Input file is not an encrypted block");
    process.exit(1);
  }

  return inputDataBuffer;
}

async function run() {
  const params = parseParams();
  const isDecrypt = params.has(optionMap.decrypt);
  const inputFile = params.get(optionMap.inputFile);
  const outputFile = params.get(optionMap.outputFile);

  const inputDataBuffer = await validateFiles(inputFile, outputFile, isDecrypt);

  if (isDecrypt) {
    const passphrase = await getPassphraseFromStdin(false, " to decrypt");
    const block = parseBlockFileData(inputDataBuffer);
    const decrypted = await decrypt(block, passphrase);

    await fs.writeFile(outputFile, decrypted);
    console.log("Completed!");
  } else {
    const passphrase = await getPassphraseFromStdin(true, " to encrypt");
    const block = await encrypt(inputDataBuffer, passphrase);
    const decrypted = await decrypt(block, passphrase);

    if (Buffer.compare(inputDataBuffer, decrypted) !== 0) {
      throw new Error("There was a problem, please try again");
    }

    await fs.writeFile(outputFile, JSON.stringify(block));
    console.log("Completed!");
  }
}

run();
