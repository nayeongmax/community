'use client';

import { useFormStatus } from 'react-dom';

/** 전송 중에는 눌리지 않도록 막는 버튼 */
export default function SubmitButton({
  children,
  pendingLabel,
  className = '',
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`disabled:opacity-60 ${className}`}>
      {pending ? (pendingLabel ?? '처리 중…') : children}
    </button>
  );
}
