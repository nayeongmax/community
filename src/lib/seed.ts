import { DB, User } from './types';
import { colorFromString, uid } from './utils';

/**
 * 최초 실행 시 데모 데이터를 채웁니다.
 * 데모 계정 3개 + 커뮤니티 3개 + 게시판/글/댓글.
 * 데모 계정 비밀번호는 모두 "1234".
 */
export function seedDB(db: DB): DB {
  const now = Date.now();
  const iso = (offsetMin: number) => new Date(now - offsetMin * 60000).toISOString();

  const mkUser = (nickname: string, email: string): User => ({
    id: uid('u_'),
    email,
    nickname,
    password: '1234',
    avatarColor: colorFromString(nickname),
    createdAt: iso(60 * 24 * 30),
  });

  const admin = mkUser('운영자', 'admin@demo.com');
  const gamja = mkUser('감자도리', 'gamja@demo.com');
  const bung = mkUser('붕어빵', 'bung@demo.com');
  db.users.push(admin, gamja, bung);

  interface SeedCommunity {
    name: string;
    slug: string;
    description: string;
    category: string;
    topics: string[];
    region?: string;
    kind?: 'normal' | 'fan' | 'featured';
    ownerId: string;
    boards: string[];
    posts: {
      board: number;
      author: string;
      title: string;
      content: string;
      tags?: string[];
      views: number;
      likes: string[];
      ageMin: number;
      comments?: { author: string; content: string; ageMin: number }[];
    }[];
  }

  const seedCommunities: SeedCommunity[] = [
    {
      name: '오늘의 유머',
      slug: 'humor',
      description: '웃긴 짤과 일상 이야기를 나누는 곳. 눈팅 환영, 첫 글 대환영!',
      category: '생활',
      topics: ['생활', '취미'],
      kind: 'featured',
      ownerId: admin.id,
      boards: ['공지사항', '자유게시판', '유머짤방', '오늘있었던일'],
      posts: [
        {
          board: 0,
          author: admin.id,
          title: '📢 오늘의 유머 커뮤니티 이용 규칙 안내',
          content:
            '안녕하세요! 즐거운 커뮤니티를 위해 아래 규칙을 지켜주세요.\n\n1. 서로 존중하기\n2. 무단 광고/도배 금지\n3. 저작권 주의\n\n즐겁게 활동해요 😊',
          views: 342,
          likes: [gamja.id, bung.id],
          ageMin: 60 * 24 * 5,
        },
        {
          board: 2,
          author: gamja.id,
          title: '우리집 고양이 근황.jpg',
          content: '오늘도 식빵 굽는 중입니다 🍞🐱 너무 귀엽지 않나요?',
          tags: ['고양이', '반려동물', '일상'],
          views: 1204,
          likes: [admin.id, bung.id],
          ageMin: 120,
          comments: [
            { author: bung.id, content: '와 진짜 식빵이네요 ㅋㅋㅋ', ageMin: 90 },
            { author: admin.id, content: '개추 누르고 갑니다', ageMin: 40 },
          ],
        },
        {
          board: 3,
          author: bung.id,
          title: '오늘 지하철에서 있었던 일',
          content: '자리 양보했더니 할머니가 사탕 주셨어요. 소소하지만 기분 좋은 하루 :)',
          tags: ['일상', '훈훈'],
          views: 530,
          likes: [gamja.id],
          ageMin: 240,
          comments: [{ author: gamja.id, content: '훈훈하네요 ㅎㅎ', ageMin: 200 }],
        },
      ],
    },
    {
      name: '주식·코인 라운지',
      slug: 'invest',
      description: '재테크와 투자 정보를 공유합니다. 투자는 본인 책임! 정보 공유는 자유롭게.',
      category: '투자',
      topics: ['투자', '부동산'],
      ownerId: gamja.id,
      boards: ['공지사항', '자유게시판', '종목토론', '코인'],
      posts: [
        {
          board: 2,
          author: gamja.id,
          title: '요즘 반도체주 어떻게 보시나요?',
          content: '조정 오면 분할매수 생각 중인데 다들 의견 어떠신가요?',
          tags: ['주식', '반도체', '투자'],
          views: 890,
          likes: [bung.id],
          ageMin: 300,
          comments: [
            { author: bung.id, content: '저는 관망 중입니다', ageMin: 250 },
            { author: admin.id, content: '장기로 보면 나쁘지 않을 듯', ageMin: 180 },
          ],
        },
        {
          board: 1,
          author: bung.id,
          title: '가계부 앱 추천 좀 해주세요',
          content: '지출 관리 시작해보려는데 다들 뭐 쓰시나요?',
          tags: ['재테크', '가계부', '앱추천'],
          views: 210,
          likes: [],
          ageMin: 500,
        },
      ],
    },
    {
      name: '자취생 요리방',
      slug: 'cook',
      description: '혼밥·자취 요리 레시피와 꿀팁 공유. 초보 요리사 환영!',
      category: '음식',
      topics: ['음식', '생활'],
      ownerId: bung.id,
      boards: ['공지사항', '자유게시판', '레시피', '주방템추천'],
      posts: [
        {
          board: 2,
          author: bung.id,
          title: '3분 완성 계란볶음밥 레시피',
          content:
            '찬밥 + 계란 2개 + 대파 + 간장 한스푼. 센불에 빠르게 볶으면 끝!\n초보도 실패 없는 자취 만능 메뉴입니다.',
          tags: ['레시피', '자취요리', '볶음밥'],
          views: 1580,
          likes: [admin.id, gamja.id],
          ageMin: 60,
          comments: [{ author: gamja.id, content: '오늘 저녁 이걸로 결정', ageMin: 30 }],
        },
        {
          board: 3,
          author: admin.id,
          title: '자취 필수템 미니 에어프라이어 추천',
          content: '3만원대인데 혼자 살면 진짜 매일 씁니다. 냉동식품 데우기 끝판왕이에요.',
          tags: ['자취', '주방템', '에어프라이어'],
          views: 640,
          likes: [gamja.id],
          ageMin: 180,
        },
      ],
    },
    {
      name: 'BMW 오너 라운지',
      slug: 'bmw',
      description: 'BMW 오너들의 정보 공유방. 정비·튜닝·드라이브 코스까지. 예비 오너도 환영!',
      category: '자동차',
      topics: ['자동차', '취미'],
      region: '서울',
      ownerId: bung.id,
      boards: ['공지사항', '자유게시판', '정비/DIY', '드라이브코스'],
      posts: [
        {
          board: 2,
          author: bung.id,
          title: '520d 엔진오일 교체 주기 어떻게 하세요?',
          content: '센터는 15000km 라는데 좀 짧게 타는 게 낫겠죠? 다들 어떻게 관리하시나요.',
          tags: ['자동차', '수입차', '정비'],
          views: 1320,
          likes: [gamja.id, admin.id],
          ageMin: 75,
          comments: [
            { author: gamja.id, content: '저는 1만에 갈아요', ageMin: 60 },
            { author: admin.id, content: '합성유면 넉넉해도 됩니다', ageMin: 20 },
          ],
        },
        {
          board: 1,
          author: gamja.id,
          title: '이번 주말 남해안 드라이브 같이 가실 분',
          content: '토요일 오전 출발 예정입니다. 코스랑 맛집 추천도 받아요!',
          tags: ['드라이브', '여행', '자동차'],
          views: 410,
          likes: [bung.id],
          ageMin: 150,
        },
      ],
    },
    {
      name: '국내여행 다녀왔어요',
      slug: 'travel',
      description: '전국 방방곡곡 여행 후기와 맛집·숙소 정보를 나눠요.',
      category: '여행',
      topics: ['여행', '음식'],
      ownerId: admin.id,
      boards: ['공지사항', '자유게시판', '여행후기', '맛집/숙소'],
      posts: [
        {
          board: 2,
          author: admin.id,
          title: '강릉 1박2일 후기 (사진 많음)',
          content: '바다 보고 커피 마시고 왔습니다. 안목해변 카페거리 강추!',
          tags: ['여행', '강릉', '맛집'],
          views: 2100,
          likes: [gamja.id, bung.id],
          ageMin: 45,
          comments: [{ author: bung.id, content: '사진 예술이네요 👍', ageMin: 30 }],
        },
        {
          board: 3,
          author: gamja.id,
          title: '부산 돼지국밥 맛집 리스트 정리',
          content: '서면·남포동 위주로 5곳 다녀온 솔직 후기입니다.',
          tags: ['부산', '맛집', '여행'],
          views: 980,
          likes: [admin.id],
          ageMin: 320,
        },
      ],
    },
    {
      name: '기아 타이거즈 팬클럽',
      slug: 'tigers',
      description: 'V13을 향하여! 기아 타이거즈 응원하는 팬들의 커뮤니티.',
      category: '스포츠',
      topics: ['스포츠', '엔터'],
      region: '광주',
      kind: 'fan',
      ownerId: gamja.id,
      boards: ['공지사항', '자유게시판', '경기토크', '직관후기'],
      posts: [
        {
          board: 2,
          author: gamja.id,
          title: '어제 경기 9회말 미쳤다 진짜 ㅠㅠ',
          content: '끝내기 안타에 소리 질렀네요. 올해 느낌 좋습니다!',
          tags: ['야구', '기아타이거즈', '직관'],
          views: 3200,
          likes: [admin.id, bung.id],
          ageMin: 25,
          comments: [
            { author: admin.id, content: '저도 봤어요 대박 ㅋㅋㅋ', ageMin: 20 },
            { author: bung.id, content: '올해 우승 가자!!', ageMin: 10 },
          ],
        },
        {
          board: 3,
          author: admin.id,
          title: '광주 직관 꿀팁 (주차/먹거리)',
          content: '경기장 근처 주차랑 먹거리 정보 정리했습니다.',
          tags: ['직관', '광주', '야구'],
          views: 720,
          likes: [gamja.id],
          ageMin: 90,
        },
      ],
    },
  ];

  for (const sc of seedCommunities) {
    const communityId = uid('c_');
    db.communities.push({
      id: communityId,
      slug: sc.slug,
      name: sc.name,
      description: sc.description,
      category: sc.category,
      topics: sc.topics,
      region: sc.region,
      kind: sc.kind ?? 'normal',
      themeColor: colorFromString(sc.name + sc.slug),
      ownerId: sc.ownerId,
      isPublic: true,
      createdAt: iso(60 * 24 * 20),
    });

    const boardIds: string[] = [];
    sc.boards.forEach((name, i) => {
      const id = uid('b_');
      boardIds.push(id);
      db.boards.push({
        id,
        communityId,
        name,
        order: i,
        isNotice: i === 0,
        createdAt: iso(60 * 24 * 20),
      });
    });

    // 개설자 owner + 나머지 데모 유저 member 가입
    db.memberships.push({
      id: uid('m_'),
      communityId,
      userId: sc.ownerId,
      role: 'owner',
      joinedAt: iso(60 * 24 * 20),
    });
    for (const u of [admin, gamja, bung]) {
      if (u.id === sc.ownerId) continue;
      db.memberships.push({
        id: uid('m_'),
        communityId,
        userId: u.id,
        role: 'member',
        joinedAt: iso(60 * 24 * 10),
      });
    }

    for (const p of sc.posts) {
      const postId = uid('p_');
      db.posts.push({
        id: postId,
        communityId,
        boardId: boardIds[p.board],
        authorId: p.author,
        title: p.title,
        content: p.content,
        tags: p.tags ?? [],
        views: p.views,
        likedBy: p.likes,
        dislikedBy: [],
        pinned: p.board === 0,
        createdAt: iso(p.ageMin),
      });
      for (const c of p.comments ?? []) {
        db.comments.push({
          id: uid('cm_'),
          postId,
          authorId: c.author,
          content: c.content,
          parentId: null,
          likedBy: [],
          createdAt: iso(c.ageMin),
        });
      }
    }
  }

  return db;
}
