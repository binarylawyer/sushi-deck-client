import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);
const PRESENTATION_EXPORT =
  "@binarylawyer/sushi-deck-kit/examples/sushii-world/presentation.html";

function addClientBase(html: string): string {
  if (/<base\s/i.test(html)) return html;

  return html.replace(
    /<head(\s[^>]*)?>/i,
    (head) => `${head}\n<base href="/sushii-world/">`,
  );
}

export async function GET() {
  try {
    const presentationPath = require.resolve(PRESENTATION_EXPORT);
    const html = await readFile(presentationPath, "utf8");

    return new Response(addClientBase(html), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Unable to load the Sushii World reference artifact", error);

    return new Response("Sushii World presentation is unavailable.", {
      status: 500,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
}
