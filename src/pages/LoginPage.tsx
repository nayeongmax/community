import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-hair p-6">
        <h1 className="text-xl font-black text-ink mb-1">로그인</h1>
        <p className="text-sm text-ink-mute mb-5">
          데모 계정: <b>admin@demo.com</b> / <b>1234</b>
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            disabled={busy}
            className="w-full bg-ink text-white font-bold py-2.5 rounded-lg hover:bg-ink-soft disabled:opacity-60"
          >
            {busy ? '로그인 중…' : '로그인'}
          </button>
        </form>
        <p className="text-sm text-ink-mute mt-4 text-center">
          아직 회원이 아니신가요?{' '}
          <Link to="/signup" className="text-ink font-semibold">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
