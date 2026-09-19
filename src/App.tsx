import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import BrowsePage from './pages/BrowsePage';
import RankingPage from './pages/RankingPage';
import GamesPage from './pages/GamesPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateCommunityPage from './pages/CreateCommunityPage';
import CommunityHomePage from './pages/CommunityHomePage';
import PostWritePage from './pages/PostWritePage';
import PostDetailPage from './pages/PostDetailPage';
import CommunitySettingsPage from './pages/CommunitySettingsPage';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <Routes>
      {/* 게임 랜드는 전용 다크 레이아웃을 쓰므로 공통 Layout 밖에 둔다 */}
      <Route path="games" element={<GamesPage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="browse/:mode" element={<BrowsePage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="create" element={<CreateCommunityPage />} />
        <Route path="me" element={<MyPage />} />
        <Route path="c/:slug" element={<CommunityHomePage />} />
        <Route path="c/:slug/write" element={<PostWritePage />} />
        <Route path="c/:slug/post/:postId" element={<PostDetailPage />} />
        <Route path="c/:slug/settings" element={<CommunitySettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
