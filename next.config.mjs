/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      // Railway (ve benzeri ters proxy'ler) arkasında Origin/Host başlıkları
      // beklenenden farklı olabildiği için Server Action isteklerinin
      // reddedilmemesi amacıyla izinli origin'ler genişletildi.
      allowedOrigins: ["*.up.railway.app", "localhost:3000"],
    },
  },
};

export default nextConfig;
