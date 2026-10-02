import "server-only";
import Replicate from "replicate";
import type { ImageRedesignProvider, RedesignInput } from "./provider";

/**
 * Replicate-backed redesign. Two input styles are supported because Replicate models differ:
 *  - "controlnet": structure-conditioned img2img, e.g. adirik/interior-design (image, prompt,
 *    negative_prompt, prompt_strength, seed). Keeps walls/windows via depth + edge conditioning.
 *  - "edit": instruction-based image editors, e.g. black-forest-labs/flux-kontext-pro (input_image, prompt).
 * Set REPLICATE_REDESIGN_MODEL (owner/model or owner/model:version) and optionally REPLICATE_INPUT_STYLE.
 */
export function createReplicateProvider(opts: {
  token: string;
  model: string;
  inputStyle?: "controlnet" | "edit";
}): ImageRedesignProvider {
  const client = new Replicate({ auth: opts.token, useFileOutput: false });
  const style = opts.inputStyle ?? (/kontext|edit|nano-banana|qwen-image-edit/i.test(opts.model) ? "edit" : "controlnet");

  return {
    name: `replicate:${opts.model}`,
    async generate(input: RedesignInput) {
      const image = input.imageUrl ?? `data:image/jpeg;base64,${input.image.toString("base64")}`;
      const payload =
        style === "edit"
          ? {
              input_image: image,
              prompt: `${input.prompt}. Keep the exact same room: identical walls, windows, doors, ceiling, beams and camera angle. Only change furniture, materials, colours and decor.`,
              seed: input.seed,
              output_format: "jpg",
            }
          : {
              image,
              prompt: input.prompt,
              negative_prompt: input.negativePrompt,
              prompt_strength: input.strength,
              guidance_scale: 15,
              num_inference_steps: 50,
              seed: input.seed,
            };

      const output = await client.run(opts.model as `${string}/${string}`, { input: payload });
      const url = Array.isArray(output) ? output[0] : output;
      if (typeof url !== "string") throw new Error("Replicate returned no image");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Could not download the generated image (${res.status})`);
      return { image: Buffer.from(await res.arrayBuffer()), providerRef: url };
    },
  };
}
