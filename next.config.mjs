/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["bullmq", "ioredis", "bcryptjs", "nodemailer"],
  eslint: {
    // Linting is run separately; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
