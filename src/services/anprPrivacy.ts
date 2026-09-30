/**
 * Prototype boundary: replace this provider with a vetted on-device ANPR model
 * in a real deployment. Its output must be hashed before it leaves the edge.
 */
export interface PlateRecognitionProvider {
  recognizePlate(frame: ImageData | Blob): Promise<string | null>;
}

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateSimulatedPlate(): string {
  const digits = () => Math.floor(Math.random() * 10);
  const letter = () => letters[Math.floor(Math.random() * letters.length)];
  return `KA${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}${letter()}${letter()}${digits()}${digits()}${digits()}${digits()}`;
}

export async function hashPlate(plate: string): Promise<string> {
  const normalized = plate.trim().toUpperCase();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function generateSimulatedPlateHash(): Promise<string> {
  // The generated identifier is intentionally scoped to this call and never stored.
  return hashPlate(generateSimulatedPlate());
}
