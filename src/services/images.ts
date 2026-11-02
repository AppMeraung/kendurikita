import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export async function compressUploadImage(uri: string, maxDimension = 1600) {
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: maxDimension,
    maxHeight: maxDimension,
  });
  const rendered = await context.renderAsync();
  return rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
}
