/**
 * Provider-agnostic image redesign. Implementations must keep the room's structure
 * (walls, windows, doors, camera angle) and change only furniture, materials and decor.
 */
export type RedesignInput = {
  /** The original room photo (JPEG bytes). */
  image: Buffer;
  /** A short-lived URL to the same image, for providers that fetch inputs. */
  imageUrl?: string;
  prompt: string;
  negativePrompt: string;
  /** 0..1: how far the result may move from the original. Lower keeps more structure. */
  strength: number;
  seed: number;
  /** Theme palette, used by the mock provider. */
  palette: string[];
  themeSlug: string;
};

export type RedesignResult = { image: Buffer; providerRef?: string };

export interface ImageRedesignProvider {
  readonly name: string;
  /** Generates one variation. Called once per variation so failures stay isolated. */
  generate(input: RedesignInput): Promise<RedesignResult>;
}
