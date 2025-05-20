/** @type {import('next').NextConfig} */
import nextra from "nextra";

const withNextra = nextra({});

const nextConfig = {
  // output: "export",
  // basePath: "/docs",
  images: {
    unoptimized: true,
  },
};

export default withNextra(nextConfig);
