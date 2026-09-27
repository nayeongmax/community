/** @type {import('next').NextConfig} */
const nextConfig = {
  // 글 페이지는 매 요청마다 서버에서 그린다 (검색로봇이 완성된 HTML 을 받도록)
  reactStrictMode: true,

  // 게임 랜드가 메인이 되면서 주소가 바뀌었다.
  // 예전 /games 주소로 들어오는 링크와 검색 색인을 그대로 살려 둔다.
  async redirects() {
    return [{ source: '/games', destination: '/', permanent: true }];
  },
};

export default nextConfig;
