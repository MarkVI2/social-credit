import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Silence optional MongoDB native deps that are not needed
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      aws4: false,
      "gcp-metadata": false,
      kerberos: false,
      snappy: false,
      socks: false,
      "@mongodb-js/zstd": false,
      "mongodb-client-encryption": false,
      "@aws-sdk/credential-providers": false,
      fs: false,
      tls: false,
      net: false,
      dns: false,
    };
    return config;
  },
};

export default nextConfig;
