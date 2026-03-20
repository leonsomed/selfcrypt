const { Jimp } = require("jimp");

async function maybeGetImageBitmap(buffer) {
  try {
    const image = await Jimp.read(buffer);
    return image.bitmap.width > 0 && image.bitmap.height > 0
      ? image.bitmap
      : undefined;
  } catch {
    return undefined;
  }
}

module.exports = {
  maybeGetImageBitmap,
};
