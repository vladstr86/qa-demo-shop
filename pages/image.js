// Browser reads shared by catalog and product page objects.
export async function imageDecoded(locator) {
  return locator.evaluate(async (image) => {
    try {
      await image.decode();
      return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    } catch {
      return false;
    }
  });
}

export async function imageFrameBounds(locator) {
  return locator.evaluate((image) => {
    const rect = (element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return { image: rect(image), frame: rect(image.parentElement) };
  });
}
