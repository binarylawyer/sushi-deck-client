import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);

const ASSET_EXPORTS = {
  "jubako-stack.webp":
    "@binarylawyer/sushi-deck-kit/examples/sushii-world/assets/jubako-stack.webp",
  "wrapped-roll.webp":
    "@binarylawyer/sushi-deck-kit/examples/sushii-world/assets/wrapped-roll.webp",
  "bento-composition.webp":
    "@binarylawyer/sushi-deck-kit/examples/sushii-world/assets/bento-composition.webp",
} as const;

type AssetName = keyof typeof ASSET_EXPORTS;

function isAssetName(name: string): name is AssetName {
  return Object.prototype.hasOwnProperty.call(ASSET_EXPORTS, name);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  if (!isAssetName(name)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const assetPath = require.resolve(ASSET_EXPORTS[name]);
    const image = await readFile(assetPath);

    return new Response(image, {
      status: 200,
      headers: {
        "content-type": "image/webp",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error(`Unable to load Sushii World asset: ${name}`, error);
    return new Response("Sushii World asset is unavailable.", {
      status: 500,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
}
