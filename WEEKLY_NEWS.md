# 주간신문 연결: 1단계

## 현재 구현 범위

- 일요일 10시 이후 기존 MVP·팀 기록 팝업과 축하 파티클을 표시하지 않습니다.
- 팝업 내부의 마지막 라운드 확정·일별 집계·Daily MVP 저장은 유지합니다.
- 라운드 종료와 일별 집계 동기화를 확인한 뒤 `prepareWeeklyNews` Callable Function을 호출합니다.
- 서버는 한국 시간 일요일 10시 이후인지, 요청일이 오늘인지 확인합니다.
- 현재 응답은 연결 확인용입니다. AI 호출, 기사 저장, 선수 데이터의 외부 전송은 하지 않습니다.
- 세 공급자는 `not-configured`, `generationEnabled`는 `false`입니다.
- 날짜별 요청 Promise를 공유해 같은 브라우저 실행 중 탭 재진입·재렌더에 따른 반복 호출을 막습니다. 새로고침·다른 기기의 요청까지 막는 서버 중복 생성 방어는 아직 없습니다.
- 함수는 정각 스케줄이 아닙니다. 기록하기 화면을 열어 둔 사용자가 있고 기존 종료 처리가 끝났을 때 호출됩니다. 사용자가 없으면 실행되지 않습니다.

## 배포 및 확인

기존 Functions 런타임 선언은 Node 18이었으며 이번 연결을 위해 Node 22로 변경했습니다. Node 22 환경에서 실행합니다. 웹 앱과 함수는 각각 배포해야 합니다.

```powershell
npm ci --prefix functions
npx firebase-tools@latest deploy --only functions:prepareWeeklyNews
npm run build
```

함수 리전은 `asia-northeast3`이며 클라이언트도 같은 리전을 사용합니다. 기존 투표 스케줄 함수는 이번 배포 명령의 대상이 아닙니다. 웹 앱은 기존 배포 방식으로 배포합니다.

종료 후 브라우저 콘솔의 `Weekly news function connected:`와 응답 `status: connected`를 확인합니다. 실패 시 `Weekly news function failed`가 표시됩니다. 실패를 1초마다 자동 재시도하지 않습니다. 배포·설정을 해결한 뒤 새로고침해 재시도합니다.

금요일이나 브라우저 시간만 조작한 일요일 요청은 서버에서 거절될 수 있습니다. 서버 시각 검증을 우회해 운영 함수를 테스트하지 말고 격리된 로컬 테스트를 사용합니다.

## 구독과 API 사용량

2026-10-23 공식 문서 확인 기준이며 개인 계정의 실제 혜택·잔액은 확인하지 않았습니다.

| 공급자 | 구독과 API의 관계 | 준비 |
| --- | --- | --- |
| GPT | ChatGPT 구독과 OpenAI API는 별도 과금 | OpenAI Platform에서 API 키와 API 결제 설정 |
| Grok | 구독의 Grok·Cursor 사용량 풀을 임의 서버 API에 그대로 사용하는 방식은 아님. API는 Console의 크레딧·청구를 확인 | xAI Console에서 API 키와 크레딧 설정 |
| Gemini | 앱 구독 사용량 자체와 API는 구분. Google AI Pro·Ultra는 자격에 따라 API에 적용 가능한 Google Cloud 크레딧 혜택이 있음 | 동일 계정으로 개발자 혜택 활성화, Cloud Billing 연결, AI Studio API 키 발급 |

Google은 Pro 월 $10, Ultra 월 $100의 Cloud 크레딧 혜택을 안내합니다. 계정·플랜별 적용 가능 여부를 확인해야 하며, Prepay 계정은 적격 크레딧을 쓰기 전에 별도 선충전이 필요할 수 있습니다. 이를 무제한 API 사용이나 추가 결제 불필요로 해석하면 안 됩니다.

## API 키 준비 방법

1. GPT: [OpenAI API 시작 안내](https://developers.openai.com/api/docs/quickstart)에서 프로젝트 API 키를 발급하고 API Billing을 설정합니다.
2. Grok: [xAI Console](https://console.x.ai/)의 API Keys에서 키를 생성하고 Billing의 API 크레딧·사용 한도를 확인합니다.
3. Gemini: [Google AI Studio 키 관리](https://aistudio.google.com/app/apikeys)에서 올바른 Cloud 프로젝트의 키를 만듭니다. 구독 크레딧을 사용한다면 해당 프로젝트의 결제 계정에 혜택이 적용됐는지 먼저 확인합니다.

키는 서버 전용 `functions/.env`에 보관합니다. 프로젝트 루트의 프런트엔드 `.env`와 구분하고 `VITE_` 접두사를 붙이지 않습니다. 실제 키를 채팅이나 예제 파일에 넣지 않습니다.

```dotenv
OPENAI_API_KEY=<OpenAI 키>
XAI_API_KEY=<xAI 키>
GEMINI_API_KEY=<Gemini 키>
```

실제 `functions/.env` 및 환경별 `.env.*`는 Git에서 제외하고, 값이 없는 `functions/.env.example`만 공유합니다. Firebase CLI는 Functions 배포·에뮬레이터 실행 시 이 폴더의 `.env`를 로드합니다. 서버 코드는 이후 `process.env.OPENAI_API_KEY` 등의 형태로 읽습니다. 직접 `node functions/index.js`를 실행할 때 자동 로드되는 것은 아닙니다.

환경 변수 변경은 Functions 재배포 후 운영에 반영됩니다. 현재 연결 확인 함수는 키를 읽거나 AI를 호출하지 않으므로, 키만 입력해도 기사가 생성되지는 않습니다. 다음 단계에서 공급자별 호출 코드를 연결해야 합니다. 기존 Secret Manager 키를 따로 생성했다면 같은 이름의 환경 변수와 중복 바인딩하지 않습니다.

주의: `.env`는 암호화된 비밀 저장소가 아닙니다. 로컬 파일·백업과 Cloud Functions 설정에 접근할 수 있는 사람에게 키가 노출될 수 있습니다. Firebase는 민감한 키에 Secret Manager를 권장하지만, 현재는 요청한 `.env` 방식으로 관리합니다. [공식 환경 변수 안내](https://firebase.google.com/docs/functions/config-env)

## 실제 기사 생성 전에 필요한 작업

- 현재 연결 확인 함수는 인증 없이 날짜 조건만 검증하고 비민감한 고정 응답만 돌려줍니다. 유료 AI 호출을 추가하기 전에 App Check·권한 검증과 서버 측 요청 제한을 구현합니다. `maxInstances: 1`은 과금 한도나 중복 호출 방지가 아닙니다.
- 경기일별 생성 잠금·상태·결과 캐시를 두어 여러 사용자가 접속해도 공급자별 1개 기사만 생성합니다.
- RTDB·Firestore 자료를 서버에서 읽어 MVP·팀 결과·듀오·상승세·기록 경신의 확정된 근거를 계산합니다. 현재 연결 확인 함수는 경기 데이터의 확정 여부를 독립적으로 검증하지 않습니다.
- 세 모델에 같은 근거와 같은 프롬프트를 전달하고 공급자·정확한 모델 ID·사용 토큰·생성 시각을 저장합니다. 기사 문체와 사실 정확도를 각각 비교합니다.
- 상승세·기록 경신은 과거 데이터가 필요합니다. 이번 주 기록만으로 AI가 추정하게 하지 않습니다.
- 실명·부상 상태 등 외부 전송 범위를 먼저 정합니다. 특히 부상 정보는 기사 생성에 자동 첨부하지 않습니다.
- 모델별 출력 길이와 지출·재시도 한도를 설정하고 공급자 하나가 실패해도 나머지 결과를 보존합니다.

## 공식 자료

- [ChatGPT와 API의 별도 결제](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform)
- [xAI API 청구 및 크레딧](https://docs.x.ai/console/billing)
- [Grok 구독 사용량 범위](https://docs.x.ai/x-subscription/usage-limits)
- [Google 구독 개발자 혜택](https://blog.google/innovation-and-ai/technology/developers-tools/gdp-premium-ai-pro-ultra/)
- [Google Cloud 크레딧과 Gemini API 적용 조건](https://developers.google.com/profile/help/faq)
- [Firebase Callable Function](https://firebase.google.com/docs/functions/callable)
