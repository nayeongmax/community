import Link from 'next/link';
import { site } from '../../../lib/site';
import { COLLECTED, operator, operatorMissing } from '../../../lib/legal';
import Legal, { Section } from '../../../components/Legal';

export const metadata = {
  title: '개인정보처리방침',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <Legal
      title="개인정보처리방침"
      effectiveDate={operator.effectiveDate}
      missing={operatorMissing}
    >
      <Section n={1} title="모으는 정보와 쓰는 이유">
        <p>{site.name}는 아래 정보만 모읍니다. 더 달라고 하지 않습니다.</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border border-hair rounded-xl overflow-hidden">
            <thead className="bg-ground text-ink-mute">
              <tr>
                <th className="text-left font-bold px-3 py-2">항목</th>
                <th className="text-left font-bold px-3 py-2">쓰는 이유</th>
                <th className="text-left font-bold px-3 py-2">보관 기간</th>
              </tr>
            </thead>
            <tbody>
              {COLLECTED.map((c) => (
                <tr key={c.item} className="border-t border-hair">
                  <td className="px-3 py-2 font-semibold text-ink whitespace-nowrap">{c.item}</td>
                  <td className="px-3 py-2">{c.why}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{c.keep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n={2} title="공개되는 정보">
        <p>
          글과 댓글에는 <b className="text-ink">아이디만</b> 보입니다. 이름·연락처·생년월일은 다른
          회원에게 보이지 않습니다.
        </p>
      </Section>

      <Section n={3} title="보관과 파기">
        <ul>
          <li>탈퇴하면 개인정보를 지체 없이 지웁니다.</li>
          <li>법에서 따로 보관하라고 정한 경우에는 그 기간 동안만 보관한 뒤 지웁니다.</li>
          <li>이미 써 둔 글은 지워지지 않습니다. 함께 지우려면 탈퇴 전에 지워 주세요.</li>
        </ul>
      </Section>

      <Section n={4} title="다른 곳에 주는지">
        <p>
          회원의 개인정보를 다른 곳에 팔거나 넘기지 않습니다. 다만 아래는 예외입니다.
        </p>
        <ul>
          <li>회원이 미리 동의한 경우</li>
          <li>법령에 따라 수사기관이 적법한 절차로 요구한 경우</li>
        </ul>
      </Section>

      <Section n={5} title="맡겨서 처리하는 일">
        <p>서비스를 돌리기 위해 아래 업체의 설비를 씁니다.</p>
        <ul>
          <li>
            <b className="text-ink">Supabase</b> — 회원 정보와 글 보관 (데이터베이스·파일 저장)
          </li>
          <li>
            <b className="text-ink">Netlify</b> — 웹사이트 운영 (서버·접속 기록)
          </li>
        </ul>
        <p>
          이 업체들의 설비는 해외에 있을 수 있습니다. 위탁 업체가 바뀌면 이 방침을 고쳐 알립니다.
        </p>
      </Section>

      <Section n={6} title="광고와 쿠키">
        <ul>
          <li>로그인을 유지하기 위해 쿠키를 씁니다. 브라우저 설정에서 거부할 수 있지만, 거부하면 로그인이 유지되지 않습니다.</li>
          <li>제휴 광고 배너(쿠팡 파트너스 등)가 실릴 수 있습니다. 광고사는 자체 쿠키로 방문 기록을 모을 수 있으며, 이는 각 광고사의 방침을 따릅니다.</li>
          <li>운영자는 광고사에 회원의 이름·연락처·생년월일을 넘기지 않습니다.</li>
        </ul>
      </Section>

      <Section n={7} title="회원이 할 수 있는 것">
        <p>
          언제든 자신의 정보를 보고, 고치고, 지우고, 처리를 멈추라고 요구할 수 있습니다. 아래
          연락처로 알려 주시면 지체 없이 처리합니다.
        </p>
      </Section>

      <Section n={8} title="안전하게 지키려고 하는 일">
        <ul>
          <li>비밀번호는 되돌릴 수 없는 방식(scrypt)으로 바꿔 보관합니다. 운영자도 원문을 볼 수 없습니다.</li>
          <li>비밀번호를 여러 번 틀리면 잠시 로그인을 잠급니다.</li>
          <li>회원 정보에는 서버만 접근할 수 있습니다.</li>
        </ul>
      </Section>

      <Section n={9} title="개인정보 보호책임자">
        {operator.privacyOfficer || operator.contact ? (
          <ul>
            {operator.name && <li>운영자 : {operator.name}</li>}
            {operator.privacyOfficer && <li>보호책임자 : {operator.privacyOfficer}</li>}
            {operator.contact && <li>연락처 : {operator.contact}</li>}
          </ul>
        ) : (
          <p className="text-rose-500">개인정보 보호책임자가 아직 등록되지 않았습니다.</p>
        )}
        <p className="mt-2">
          이용 조건은{' '}
          <Link href="/terms" className="font-semibold text-ink underline">
            이용약관
          </Link>
          을 확인해 주세요.
        </p>
      </Section>

      <Section n={10} title="방침 변경">
        이 방침이 바뀌면 시행 7일 전에 서비스 안에 알립니다. 회원에게 불리하게 바뀌는 경우에는
        30일 전에 알립니다.
      </Section>
    </Legal>
  );
}
