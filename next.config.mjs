/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/misurazioni/[id]/pdf": ["./node_modules/pdfkit/js/standard-fonts/**"],
    "/api/**": ["./node_modules/pdfkit/js/standard-fonts/**"],
  },
};

export default nextConfig;
