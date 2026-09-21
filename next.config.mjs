/** @type {import('next').NextConfig} */
const nextConfig = {
  // 글 페이지는 매 요청마다 서버에서 그린다 (검색로봇이 완성된 HTML 을 받도록)
  reactStrictMode: true,
};

export default nextConfig;
