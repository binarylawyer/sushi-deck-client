/** @type {import('next').NextConfig} */
const nextConfig = {
  // The kit ships TypeScript source (no build step), so Next must transpile it.
  transpilePackages: ["@binarylawyer/sushi-deck-kit"],
  // Sushii World is a package-owned reference artifact read by Node routes at
  // runtime. Keep the HTML and artwork in the Vercel server trace without
  // copying them into this application's public directory.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@binarylawyer/sushi-deck-kit/examples/sushii-world/**/*",
    ],
  },
};

export default nextConfig;
