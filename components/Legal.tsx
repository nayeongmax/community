import type { ReactNode } from 'react';

/** 약관·개인정보처리방침이 함께 쓰는 문서 틀 */
export default function Legal({
  title,
  effectiveDate,
  missing,
  children,
}: {
  title: string;
  effectiveDate: string;
  /** 운영자 정보가 아직 비어 있는가 */
  missing?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="max-w-2xl mx-auto py-4">
      <h1 className="text-2xl font-black text-ink">{title}</h1>
      <p className="text-sm text-ink-faint mt-1">시행일 {effectiveDate}</p>

      {missing && (
        <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 leading-relaxed">
          <b>운영자 정보가 아직 비어 있습니다.</b> 환경변수{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_OPERATOR_NAME</code> ·{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_OPERATOR_CONTACT</code> ·{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_PRIVACY_OFFICER</code> 를 채워 주세요.
        </p>
      )}

      <div className="mt-6 space-y-7">{children}</div>
    </article>
  );
}

/** 조항 하나 */
export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-bold text-ink mb-2">
        제{n}조 ({title})
      </h2>
      <div className="text-sm text-ink-mute leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
