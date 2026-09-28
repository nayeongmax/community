import Link from 'next/link';
import { site } from '../../../lib/site';
import { operator, operatorMissing } from '../../../lib/legal';
import Legal, { Section } from '../../../components/Legal';

export const metadata = {
  title: '이용약관',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <Legal title="이용약관" effectiveDate={operator.effectiveDate} missing={operatorMissing}>
      <Section n={1} title="목적">
        이 약관은 {site.name}(이하 &ldquo;서비스&rdquo;)를 이용하는 데 필요한 조건과 절차, 회원과
        운영자의 권리·의무를 정합니다.
      </Section>

      <Section n={2} title="회원 가입">
        <ul>
          <li>아이디·비밀번호·이름·연락처·생년월일을 입력하고, 이 약관과 개인정보 수집·이용에 동의하면 가입됩니다.</li>
          <li>다른 사람의 정보를 도용해 가입할 수 없습니다.</li>
          <li>만 14세 미만은 법정대리인의 동의 없이 가입할 수 없습니다.</li>
        </ul>
      </Section>

      <Section n={3} title="서비스 내용">
        <ul>
          <li>커뮤니티 개설과 글·댓글 작성</li>
          <li>익명 게시판과 미니게임</li>
          <li>운영 사정에 따라 일부 기능이 바뀌거나 중단될 수 있으며, 미리 알립니다.</li>
        </ul>
      </Section>

      <Section n={4} title="회원이 쓴 글">
        <ul>
          <li>글과 댓글의 저작권은 쓴 사람에게 있습니다.</li>
          <li>운영자는 서비스를 보여 주고 검색에 노출하는 범위에서 글을 사용할 수 있습니다.</li>
          <li>회원이 글을 지우면 화면에서 사라집니다. 다른 회원이 이미 인용하거나 퍼간 것까지는 지우지 못합니다.</li>
        </ul>
      </Section>

      <Section n={5} title="하면 안 되는 것">
        <ul>
          <li>남을 비방하거나 괴롭히는 글, 차별·혐오 표현</li>
          <li>음란물, 불법 정보, 도박 등 법을 어기는 내용</li>
          <li>광고·홍보를 목적으로 반복해서 올리는 글 (운영자가 허락한 경우 제외)</li>
          <li>다른 사람의 개인정보를 동의 없이 올리는 행위</li>
          <li>서비스를 자동으로 긁어 가거나 정상 운영을 방해하는 행위</li>
        </ul>
        위반한 글은 알림 없이 지울 수 있고, 반복되면 이용을 제한할 수 있습니다.
      </Section>

      <Section n={6} title="탈퇴와 이용 제한">
        <ul>
          <li>회원은 언제든 탈퇴할 수 있습니다. 탈퇴하면 개인정보는 지워집니다.</li>
          <li>이미 쓴 글은 남을 수 있습니다. 함께 지우려면 탈퇴 전에 지워 주세요.</li>
          <li>약관을 어기면 운영자가 이용을 제한할 수 있습니다.</li>
        </ul>
      </Section>

      <Section n={7} title="광고">
        서비스에는 제휴 광고 배너가 실릴 수 있습니다. 광고를 눌러 이루어진 거래는 해당 판매자와
        회원 사이의 거래이며, 운영자는 그 거래에 대해 책임지지 않습니다.
      </Section>

      <Section n={8} title="책임">
        <ul>
          <li>운영자는 회원이 올린 글의 내용에 대해 책임지지 않습니다.</li>
          <li>천재지변, 통신 장애 등 어쩔 수 없는 사유로 서비스가 멈춘 경우 책임지지 않습니다.</li>
          <li>무료로 제공하는 서비스에서 생긴 손해는 운영자의 고의나 중대한 잘못이 없는 한 배상하지 않습니다.</li>
        </ul>
      </Section>

      <Section n={9} title="약관 변경">
        약관이 바뀌면 시행 7일 전에 서비스 안에 알립니다. 회원에게 불리한 변경은 30일 전에
        알립니다. 바뀐 약관에 동의하지 않으면 탈퇴할 수 있습니다.
      </Section>

      <Section n={10} title="문의">
        {operator.contact ? (
          <p>{operator.contact}</p>
        ) : (
          <p className="text-rose-500">운영자 연락처가 아직 등록되지 않았습니다.</p>
        )}
        <p className="mt-2">
          개인정보 처리에 대해서는{' '}
          <Link href="/privacy" className="font-semibold text-ink underline">
            개인정보처리방침
          </Link>
          을 확인해 주세요.
        </p>
      </Section>
    </Legal>
  );
}
