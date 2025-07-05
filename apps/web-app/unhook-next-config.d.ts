declare module '@unhook/next-config/base' {
  interface NextConfig {
    [key: string]: unknown;
  }
  const config: NextConfig;
  export default config;
}
