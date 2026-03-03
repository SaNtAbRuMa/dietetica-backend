/**
 * Extrae la etiqueta de tamaño/presentación de un nombre de producto.
 * Ej: "Aceite De Coco Gb 125ml Neutro" → "125ml"
 * Si no hay medida, devuelve el nombre completo como fallback.
 */
export const SIZE_REGEX = /\b(\d+(?:[.,]\d+)?\s*(?:ml|cc|lt|l|g|gr|kg|cm3|oz))\b/i;

export function getSizeLabel(name: string): string {
  const match = name.match(SIZE_REGEX);
  return match ? match[0].toLowerCase() : name;
}
