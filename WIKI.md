# FLFC 프로젝트 위키

풋살 경기 기록, 주간 팀 편성, 개인·팀 통계와 시즌 분석을 제공하는 웹 프로젝트의 개발·운영 문서입니다.

> 기준일: 2026-10-12. 현재 체크아웃의 소스를 기준으로 작성했습니다. Firebase의 실제 배포 상태, 보안 규칙, 운영 데이터는 별도로 조회하지 않았습니다. 예제의 선수명과 기록은 설명용입니다.

> 2026-10-23 추가: 종료 후 MVP·팀 통계 팝업은 숨기고 내부 확정·저장은 유지합니다. 종료·집계 확인 후 주간신문 연결 확인 함수를 호출합니다. 기사 생성과 세 공급자의 키 설정은 아직 미연결이며, 상세 절차는 [주간신문 연결 안내](WEEKLY_NEWS.md)를 참고합니다.

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시작하기](#2-시작하기)
3. [화면과 기능](#3-화면과-기능)
4. [폴더 구조](#4-폴더-구조)
5. [데이터 흐름](#5-데이터-흐름)
6. [Firestore 데이터 구조](#6-firestore-데이터-구조)
7. [Realtime Database 데이터 구조](#7-realtime-database-데이터-구조)
8. [기록과 경기 종료 규칙](#8-기록과-경기-종료-규칙)
9. [분석 선정 기준](#9-분석-선정-기준)
10. [캐시와 실시간 반영](#10-캐시와-실시간-반영)
11. [관리자 기록 수정](#11-관리자-기록-수정)
12. [공통 UI와 테스트](#12-공통-ui와-테스트)
13. [빌드와 배포](#13-빌드와-배포)
14. [운영 주의사항과 문제 확인](#14-운영-주의사항과-문제-확인)

## 1. 프로젝트 개요

| 구분 | 구성 |
| --- | --- |
| 프런트엔드 | React 18, JavaScript ES Modules |
| 개발·빌드 | Vite 5, React SWC 플러그인 |
| 라우팅 | React Router 6 |
| 전역 상태 | Jotai |
| 스타일 | Tailwind CSS, styled-components, 개별 CSS |
| 데이터 | Firebase Firestore, Realtime Database |
| 서버 작업 | Firebase Cloud Functions |
| 기타 | SweetAlert2, Kakao SDK, Vercel Analytics, 파티클·Three.js 관련 코드 |

의존성의 버전 범위는 [package.json](package.json), 설치 버전은 `package-lock.json`을 기준으로 확인합니다.

Firestore는 회원 정보와 일별 집계·주간 팀·수상 기록을, RTDB는 라운드와 골·어시 등의 상세 이벤트를 담당합니다. 두 저장소가 하나의 트랜잭션으로 묶이는 구조는 아닙니다.

## 2. 시작하기

### 설치와 실행

프로젝트 루트에서 실행합니다. Node.js와 npm이 필요합니다.

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

실제 접속 주소는 Vite가 출력한 URL을 사용합니다. 기본 포트는 `5173`이며 이미 사용 중이면 다른 포트가 선택될 수 있습니다. 종료는 실행한 터미널에서 `Ctrl+C`입니다.

```powershell
npm run build
npm run preview -- --host 127.0.0.1
npm run lint
```

- `build`: `dist/`에 배포용 결과물을 생성합니다.
- `preview`: 빌드 결과물을 로컬에서 확인합니다.
- `lint`: 경고도 실패로 처리합니다(`--max-warnings 0`).

### 환경 변수

루트 `.env`에 다음 이름으로 값을 설정합니다. 대소문자를 구분하며, 실제 값은 위키나 Git에 넣지 않습니다.

```dotenv
VITE_apiKey=<Firebase Web API Key>
VITE_authDomain=<Firebase Auth Domain>
VITE_projectId=<Firebase Project ID>
VITE_databaseURL=<Realtime Database URL>
VITE_storageBucket=<Storage Bucket>
VITE_messagingSenderId=<Messaging Sender ID>
VITE_appId=<Firebase App ID>
VITE_measurementId=<Measurement ID>
VITE_KAKAO_API_KEY=<Kakao JavaScript Key>
```

Firebase 초기화는 [firebase.js](firebase.js)에서 수행합니다. Kakao 키는 투표·주간 팀의 Kakao 연동에서 사용합니다. SDK는 [index.html](index.html)의 외부 스크립트로 로드됩니다.

`VITE_` 변수는 클라이언트 번들에 포함됩니다. 서버 비밀키나 서비스 계정 개인키를 여기에 넣으면 안 됩니다. 환경 변수 변경 후에는 개발 서버를 다시 시작하거나 빌드를 다시 해야 합니다.

> 로컬 주소로 접속하더라도 Firebase 설정이 운영 프로젝트를 가리키면 운영 데이터에 연결됩니다. `localhost` 자체가 테스트 격리를 보장하지 않습니다.

## 3. 화면과 기능

| 경로 | 화면 | 주요 기능 |
| --- | --- | --- |
| `/` | 메인 | 기록하기, 현황판, 기록실, 주간 팀 탭 |
| `/weeklyTeam` | 메인 내 주간 팀 | 주간 팀 탭을 바로 선택 |
| `/vote` | 투표 | 참여 투표·댓글 및 관련 회원 정보 처리 |
| `/admin` | 관리자 | 경기 시간에는 라운드 관리, 이외에는 3개월 이상 미참여 목록 |
| `/dev` | 개발용 | 개발용 페이지와 데이터 작업 헬퍼 |

라우트 정의: [App.jsx](src/App.jsx).

### 메인 탭

- **기록하기**: 진행 라운드, 골·어시 입력, 경기 팀 변경, 라운드 종료, 피버 타임, 종료 후 팀 통계·Daily MVP.
- **현황판**: 분기별 기록을 집계한 표. 이름·기록 컬럼의 정렬, 선택 컬럼 강조, 수상자 뱃지 등을 제공합니다.
- **기록실**: 분석, 승점, 출석, 골, 어시, 히스토리. 기록 표는 연도·월 선택을 지원합니다.
- **주간 팀**: 날짜별 1·2·3팀 명단을 조회하고 편집·등록합니다.

탭 연결: [TapTemplate.jsx](src/components/templates/TapTemplate.jsx), [RecordRoom.jsx](src/components/templates/ParentTap/RecordRoom.jsx).

### 개인기록 모달

은퇴하지 않은 회원의 이름을 선택해 조회합니다. 해당 시즌 출석이 없어도 이름을 표시하며, 시즌 기록이 없다는 안내와 통산 기록을 함께 제공합니다.

- 이름과 `injured === true`일 때의 **부상중** 뱃지.
- 이름 아래 주발, `startDate`로 만든 가입일 표시(`since yyyy.mm`).
- 골·어시·승점·승점생산률·출석의 전체 인원 대비 오각형 그래프.
- 시즌 기록, 통산 합계·최고 기록, 최다 같은 팀·골 합작 파트너.
- `history` 기반 수상 횟수. 수상 기록이 없으면 해당 뱃지를 표시하지 않습니다.
- 2026년 1분기부터의 골·어시·승점 분기 추세.

관련 파일: [AnalysisTap.jsx](src/components/templates/ChildTap/AnalysisTap.jsx), [PlayerRadarChart.jsx](src/components/organisms/PlayerRadarChart.jsx), [QuarterlyRecordChart.jsx](src/components/organisms/QuarterlyRecordChart.jsx).

## 4. 폴더 구조

```text
flfc/
  src/
    apis/                 집계, 캐시, 이름 해석, 관리자 저장 로직
    hooks/                데이터 구독, 시각, 분석 로딩, 테마·제스처
    store/atoms.js        회원·기록·투표·시각의 Jotai 상태
    config/               기록 입력 UI 테스트 모드
    components/
      atoms/              버튼, 뱃지, 입력, 파티클 등
      molecules/          골 기록 행, 라운드 행, 입력 폼 등
      organisms/          기록 목록, 입력, 차트, 관리자 기록 관리 등
      templates/          메인 탭·기록실 하위 탭·투표 화면
      pages/              라우트별 페이지
    assets/               이미지·폰트 등의 시각 자산
    football/             별도 축구공 시각 실험 관련 코드
  functions/              Firebase 서버 함수와 별도 의존성
  public/                 정적 자산
  dist/                   기본 웹 앱의 빌드 결과
  dist-football/          별도 실험 관련 산출물
  firebase.js             클라이언트 Firebase 초기화
  firebase.json           Functions 소스 설정
  .firebaserc             Firebase 프로젝트 별칭
  vite.config.js          Vite 플러그인과 @ 경로 별칭
  vercel.json             SPA 경로 재작성
  WIKI.md                 이 문서
```

`@/`는 `src/`의 별칭입니다. 앱을 수정할 때는 `src/`를 수정하고, `dist/` 파일은 직접 편집하지 않습니다.

## 5. 데이터 흐름

```text
Firestore members         -> useUpdateMembers -> 회원 atoms
Firestore weeklyTeam      -> onSnapshot       -> 주간 팀 atom
RTDB YYYY/MMDD_rounds     -> onValue          -> 라운드 atom
Firestore YYYY/MMDD       -> 연도 데이터 구독·캐시 -> 기록 atom -> 현황판·기록실

기록 입력·라운드 종료     -> RTDB 상세 기록 변경
                         -> 상세 기록 + 주간 팀 명단을 재집계
                         -> Firestore YYYY/MMDD 저장

분석 화면                 -> 시즌 선택 + 연도 기록 + 라운드 + 회원 정보
                         -> 순수 집계 함수 -> 항목·개인 모달·차트
```

### 주요 역할

| 파일 | 역할 |
| --- | --- |
| [updateMembers.js](src/hooks/updateMembers.js) | 회원 문서들을 읽어 전체·현역·은퇴·외자·별명 정보를 설정 |
| [updateRecords.js](src/hooks/updateRecords.js) | 라운드·수정 요청·주간 팀 구독, 연도 기록 공급, 현황판 재집계 |
| [atoms.js](src/store/atoms.js) | 화면 간 공유 상태 |
| [LetsRecord.jsx](src/components/templates/ParentTap/LetsRecord.jsx) | 라운드 표시, 일별 집계 저장, 기록 시간 판정 |
| [WriteContainer.jsx](src/components/organisms/WriteContainer.jsx) | 골 입력, 득점 팀 판정, 라운드 생성·승리 처리 |
| [formatDailyRecordStats.js](src/apis/formatDailyRecordStats.js) | 상세 이벤트를 회원별 일별 기록으로 변환 |
| [recordMembers.js](src/apis/recordMembers.js) | 풀네임·이름·외자·별명 해석 및 주간 팀 찾기 |

회원 목록은 앱 초기 조회로 공급됩니다. `members/info`는 분석에서 `useBestFive`의 별도 실시간 구독을 사용합니다.

## 6. Firestore 데이터 구조

### 경로와 역할

| 경로 | 용도 |
| --- | --- |
| `members/members` | `total`, `retired`, `oneCharacter`, `nickName` 등 회원 목록·이름 해석 정보 |
| `members/members_id` | 투표 등에서 사용하는 회원 식별 정보 |
| `members/info` | 풀네임별 주발·골키퍼 여부·가입일·부상 상태 |
| `weeklyTeam/YYMMDD` | 경기일별 팀 명단 |
| `YYYY/MMDD` | 회원별 출석·골·어시·승점·경기의 일별 집계 |
| `YYYY/last_season_kings` | 현황판에서 참조하는 이전 시즌 수상 정보 |
| `daily_mvp/YYMMDD` | Daily MVP의 `bestPlayers` 배열 |
| `history/YYYY_1st` 등 | 분기별 승점왕·출석왕·득점왕·어시왕 |
| `balancer/<문서 ID>` | 주간 팀 화면의 `name` 정보 |

`YYYY/MMDD`는 예를 들어 컬렉션 `2026` 안의 문서 `1011`입니다. RTDB의 비슷한 날짜 경로와 혼동하지 않습니다.

### 회원 상세 정보 예시

`members/info`는 선수별 문서가 아니라, 선수 이름을 키로 가진 **하나의 문서**입니다.

```json
{
  "홍길동": {
    "preferredFoot": "L",
    "goalKeeper": false,
    "startDate": "2026-01-04",
    "injured": true
  }
}
```

- `preferredFoot`: `L`은 왼발, `R`은 오른발입니다.
- `goalKeeper`: 골키퍼 여부. 일부 집계는 이전 표기인 `goalkeeper`도 지원합니다.
- `startDate`: 개인 모달은 `YYYY-MM-DD` 문자열을 읽습니다.
- `injured`: 불리언 `true`일 때만 부상중 뱃지를 표시합니다. 현재 부상 뱃지 자체는 선발·집계 제외 조건이 아닙니다.

이 문서를 수정할 때 한 선수의 필드만 수정해야 합니다. 문서 전체를 `setDoc`으로 교체하면 다른 선수나 기존 필드까지 삭제될 수 있습니다.

### 주간 팀 예시

`weeklyTeam/261011`:

```json
{
  "1": ["홍길동"],
  "2": ["김철수"],
  "3": ["", "", "", "", "", ""]
}
```

풀네임 입력을 지원합니다. 빈 문자열은 빈 슬롯입니다. 불참하는 3팀은 빈 명단으로 유지할 수 있습니다.

일요일에 오늘 문서가 없으면 `MainPage`가 Firestore 트랜잭션으로 빈 명단을 생성합니다. 문서가 이미 있으면 덮어쓰지 않습니다. 주간 팀 저장은 경기 기록의 시간 제한과 별개입니다.

### 일별 집계 예시

`2026/1011`:

```json
{
  "홍길동": {
    "출석": 1,
    "골": 2,
    "어시": 1,
    "승점": 4,
    "경기": 2
  }
}
```

출석은 하루에 1회, 경기는 참여한 라운드 수입니다. 승리 라운드는 3점, 무승부 라운드는 1점을 받습니다. 공격포인트는 `골 + 어시`, 승점생산률은 `승점 / 경기`입니다.

### 시즌 수상 기록 예시

`history/2026_3rd`:

```json
{
  "point_king": ["홍길동"],
  "attendance_king": ["홍길동", "김철수"],
  "goal_king": "홍길동",
  "assist_king": ["김철수"]
}
```

히스토리는 `YYYY_1st`, `YYYY_2nd`, `YYYY_3rd`, `YYYY_4th` 형식만 시즌 행으로 사용합니다. 수상자는 문자열과 배열을 모두 처리합니다. `history/last_season`, `history/changed_last_season`은 현재 시즌 행으로 사용되지 않습니다.

## 7. Realtime Database 데이터 구조

| 경로 | 용도 |
| --- | --- |
| `YYYY/MMDD_rounds/<roundId>` | 라운드와 그 안의 골 상세 기록 |
| `YYYY/MMDD_backup/<goalId>` | 일반 골 등록 시 저장하는 백업 사본 |
| `YYYY/MMDD_request` | 기존 기록 수정 요청 데이터 |
| `YYYY/MMDD` | 과거 골 전용 데이터 형식 |
| `typing/users/<userId>` | 다른 사용자의 입력 중 상태 |
| `vote/YYYY/MMDD` | 참여 투표 데이터 |
| `vote/YYYY/MMDD_reply/<replyId>` | 투표 댓글 |
| `maintenance` | 메인 화면의 점검 표시 값 |

### 라운드 예시

`2026/1011_rounds/01`:

```json
{
  "id": "01",
  "index": 0,
  "time": "08:00:00",
  "teamList": ["1", "2"],
  "participant": ["홍길동", "김철수"],
  "getGoalTeam": ["1"],
  "winnerTeam": {
    "number": ["1"],
    "member": ["홍길동"]
  },
  "lostTeam": "2",
  "goal": {
    "sample-goal": {
      "id": "sample-goal",
      "time": "08:03:00",
      "goal": "홍길동",
      "assist": "",
      "team": "1",
      "fever": false
    }
  }
}
```

- `roundId`는 실제 저장 키, `index`는 표시·정렬 순서입니다. 삭제 후에는 화면 순번과 저장 키가 다를 수 있습니다.
- `teamList`: 경기 중인 두 팀의 문자열 번호.
- `participant`: 해당 라운드 참여 선수. 팀 명단에서 추출해 경기 수 집계에 사용합니다.
- `getGoalTeam`: 일반 득점의 팀 번호 목록. 스코어와 승패 계산에 사용합니다.
- `winnerTeam.number`: 한 팀이면 승리, 두 팀이면 무승부. 진행 중인 라운드는 승리 정보가 없습니다.
- `winnerTeam.member`: 승점 부여 대상입니다.
- 골 객체의 `team`, `fever`는 관리자 저장에서 명시합니다. 이전 기록에는 없을 수 있어 표시 코드가 기존 배열·마커도 함께 해석합니다.
- `goal/fever-time-bar`는 피버 타임 경계 마커입니다. 골이나 어시로 집계하지 않습니다.

현재 시즌 분석은 `_rounds`를 사용합니다. 다만 통산 골 합작 집계는 오래된 날짜에 `_rounds`가 없으면 `YYYY/MMDD`를 읽는 호환 처리가 남아 있습니다. 두 형식이 함께 있으면 `_rounds`만 우선 사용합니다.

백업 경로는 수정·삭제된 상세 기록과 항상 동기화되는 주 데이터가 아닙니다. 자동 복원이나 집계의 기준으로 사용하지 않습니다.

## 8. 기록과 경기 종료 규칙

### 시간 기준

| 동작 | 현재 코드의 시간 조건 |
| --- | --- |
| 일반 기록 입력·일별 집계 저장 | 일요일 07:50부터 10:00까지, 끝 시각 포함 |
| 종료 후 일별 집계 반영 | 일요일 10:00부터 23:59까지, `showMVP`가 활성화된 경우 |
| 관리자 라운드 수정 | 한국 시간 일요일 08:00 이상, 10:00 미만 |
| 피버 타임 버튼 표시 | 기록 화면이 열리고 09:45가 지난 경우 |
| 주간 팀 문서 저장 | 위 경기 기록 시간 조건을 사용하지 않음 |

일반 기록 시각은 [currentTimeState.js](src/apis/currentTimeState.js)의 브라우저 `Date` 기준입니다. 시간 상태는 1초마다 갱신됩니다. 관리자와 분석 캐시 날짜는 `Asia/Seoul`을 명시해 계산합니다.

### 일반 기록 처리

1. 입력 이름을 회원 목록·외자·별명 정보로 해석합니다.
2. 득점자의 주간 팀을 확인합니다. 결정할 수 없거나 현재 경기 팀이 아니면 어느 팀의 득점인지 선택받습니다.
3. 일반 득점의 팀 번호를 `getGoalTeam`에 반영하고 골 상세와 백업을 저장합니다.
4. 일반 득점 처리에서는 한 팀이 2골을 기록하면 승리 처리하고 다음 라운드를 생성합니다.
5. 다음 라운드를 만들 때 이전 라운드의 `teamList`에 해당하는 주간 팀 명단을 `participant`에 넣습니다.
6. RTDB 구독이 변경된 라운드를 화면에 전달하고, `formatDailyRecordStats`가 Firestore용 일별 집계를 계산합니다.

`registerRecord`는 RTDB와 기존 Firestore 기록의 로딩이 끝난 후 값을 비교합니다. 이미 골·승점 등의 활동이 있는 기록을 출석만 있는 초기 상태로 덮어쓰는 것도 건너뜁니다.

### 마지막 라운드 종료

현재 소스에서는 [TeamScorePopup.jsx](src/components/organisms/TeamScorePopup.jsx)가 종료 화면의 마지막 미종료 라운드를 RTDB 트랜잭션으로 확정합니다. 계산은 [finalizeRound.js](src/apis/finalizeRound.js)에 있습니다.

- 이미 승패가 저장된 라운드는 다시 확정하지 않습니다.
- 두 팀의 실제 일반 득점을 비교해 승리 또는 무승부를 결정합니다.
- 골이 없는 라운드의 **시작 시각이 09:55 이상**이면 삭제합니다. 처리 당시 시각이 기준인 것은 아닙니다.
- 09:55 이전에 시작한 0:0 라운드는 무승부로 기록합니다.
- 득점 상세와 득점 팀 배열의 개수가 맞지 않으면 확정을 보류합니다.
- 확정할 때 `participant`와 승점 대상도 함께 채웁니다.

> 현재 `functions/index.js`에는 경기 종료·일별 기록 확정 스케줄이 없습니다. 브라우저 없이 서버가 경기 종료를 확정한다고 가정하면 안 됩니다. 실제 배포된 함수가 소스와 다른지는 별도 확인이 필요합니다.

### 피버 타임

피버 타임의 골·어시는 개인 기록에는 반영하되 일반 경기 승패의 득점에는 포함하지 않습니다. 화면에서는 팀 표시를 생략하고 마커 이후 기록을 구분합니다. 관리자 저장은 `fever` 필드도 사용합니다.

팀 통계의 3팀 행은 주간 명단에 실제 선수가 있거나 라운드에 3팀 참여 기록이 있을 때 표시합니다.

## 9. 분석 선정 기준

### 시즌과 로딩

[useAnalysisSeason.js](src/hooks/useAnalysisSeason.js)는 현재 분기의 Firestore 출석 기록·RTDB 골 기록을 확인합니다. 현재 분기에 경기 데이터가 없으면 바로 이전 분기만 대체 시즌으로 선택합니다.

- 한 주 이상의 경기 데이터가 있으면 이번 시즌 분석을 계산합니다.
- 로딩·오류·데이터 없음은 별도로 표시합니다. 현재 코드에 일괄적인 4주 최소 조건은 없습니다.
- 최근 상승세·하락세처럼 개별 항목에 필요한 출석 조건은 따로 적용합니다.
- 빈 명단이나 빈 라운드만 있는 날짜는 실제 시즌 경기 데이터로 간주하지 않습니다.

### BEST 5

[analyzeBestFive.js](src/apis/analyzeBestFive.js) 기준입니다.

공통 자격은 해당 시즌 실제 출석일의 **50% 이상 출석**입니다. 인원을 중복 배치하지 않으며, 후보가 없으면 해당 자리가 비어 있을 수 있습니다.

| 포지션 | 기준 |
| --- | --- |
| ST | 골 최다. 동률은 어시, 이름 순 |
| LM | `preferredFoot === 'L'` 중 어시 최다. 동률은 골, 이름 순 |
| RM | `preferredFoot === 'R'` 중 어시 최다. 동률은 골, 이름 순 |
| DF | 남은 후보 중 승점생산률 최상위 |
| GK | 등록 골키퍼 중 승점생산률 최상위를 먼저 확보. 없으면 남은 승점생산률 후보 |

선발 처리 순서는 ST, 등록 GK 확보, LM, RM, DF, GK 대체입니다. 따라서 중복된 1위 후보가 있으면 각 포지션은 남은 후보를 사용합니다. 승점생산률 후보는 경기 수가 0보다 커야 하며, 동률은 공격포인트·골·어시·이름 순으로 정합니다.

### 주요 시즌 항목

| 항목 | 현재 집계 기준 |
| --- | --- |
| 손케 듀오 | 골·어시를 서로 연결한 합작 골 최다. 득점자·도움 선수 역할이 바뀌어도 같은 조합 |
| 추격 듀오 | 최다 합작 골 다음의 서로 다른 골 수에 해당하는 조합. 1~2조합만 표시하고 3조합 이상 동률이면 표시하지 않음 |
| 와이리 많이 봅니까 우리 | 최다 같은 팀 조합. 단독 1위만 표시하며 공동 1위이면 이름 대신 `-` |
| 친해지자.. | 같은 팀 출석일 2회 이상인 조합 중 `실제 서로 합작한 골 / 같은 팀 출석일` 최저. 골키퍼 제외 |
| 얼리 스타터 | 09:00 이전 승점생산률이 이후보다 높은 선수 중 두 시간대의 생산률 차이가 최대 |
| 슬로우 스타터 | 09:00 이후 승점생산률이 이전보다 높은 선수 중 두 시간대의 생산률 차이가 최대 |
| 최근 상승세·하락세 | 최근 출석 2회와 직전 2회의 공격포인트·승점 합계를 비교. 출석으로 다시 나누지 않음 |
| 10-10 / 20-20 클럽 | 골과 어시가 각각 기준 이상인 선수. 달성 임박 후보도 별도로 표시 |
| 세 얼간이 | 함께한 라운드의 승률을 집계하는 트리오 항목 |

`친해지자..`는 두 선수의 개인 공격포인트 합계가 아닙니다. 같은 날 다른 선수와 만든 골·어시는 이 조합의 합작 골에 더하지 않습니다. 생산률이 같으면 같은 팀 출석일이 많은 조합을 우선하며, 비율과 출석일 수가 모두 같은 조합들을 함께 표시합니다.

얼리·슬로우 스타터는 라운드 시작 시각으로 시간대를 나누고 07:50 이상, 10:00 미만 라운드를 사용합니다. 최근 상승세·하락세는 시즌 출석 2회 이상이고, 비교할 총 4회 출석이 최근 8주 범위에 있어야 합니다.

### 통산 항목과 차트

통산 영역에는 누적 골·어시·승점·MVP, 통산 합작 듀오, 일일 최다 골·어시, 연속 득점·연속 어시, 마지막 출석이 오래된 선수 등의 항목이 있습니다.

연속 기록은 **본인이 출석한 날**을 기준으로 계산합니다. 개인 분기 추세 차트는 2026년부터 표시하며, 골·어시·승점을 각각 자신의 표시 대상 최고 분기 값 대비 0~100으로 정규화합니다. 범례의 선택 항목을 강조하고 수치도 표시하므로 서로 단위가 다른 기록의 변화 흐름을 비교할 수 있습니다.

## 10. 캐시와 실시간 반영

| 데이터 | 현재 읽기 방식 |
| --- | --- |
| 기록하기 라운드·수정 요청 | `updateRecords`의 RTDB `onValue` 구독 |
| 주간 팀 | Firestore 컬렉션 `onSnapshot` |
| 연도별 Firestore 집계 | 일요일에는 연도당 공유 `onSnapshot`, 다른 요일에는 캐시·서버 조회 |
| 분석 연도별 RTDB | 일요일에는 `onValue`, 다른 요일에는 캐시·서버 조회 |
| `members/info` | 분석의 Firestore 문서 `onSnapshot` |
| `history` | 분석 캐시를 통한 서버 조회. 상시 실시간 구독은 아님 |
| 회원 목록 | 앱 초기 Firestore 조회 |

캐시는 [analysisDataCache.js](src/apis/analysisDataCache.js)에 구현되어 있습니다.

- 브라우저 메모리와 IndexedDB `flfc-analysis-cache`의 `entries` 저장소를 사용합니다.
- 같은 키의 동시 조회·로드를 합쳐 중복 네트워크 요청을 줄입니다.
- 한국 시간 일요일에는 이전 캐시를 최신으로 간주하지 않습니다.
- 월요일 이후 저장된 데이터는 같은 주의 토요일까지 재사용할 수 있습니다. 일요일에 저장한 스냅샷은 평일의 최신 캐시로 인정하지 않습니다.
- 네트워크 오류 시 이전 캐시를 반환할 수 있어, 화면이 항상 서버의 최신 상태라고 단정할 수는 없습니다.

### Firebase 콘솔에서 직접 수정한 경우

실시간 구독 중인 데이터는 변경이 전달됩니다. 반면 평일의 분석 캐시와 히스토리는 이전 데이터가 보일 수 있습니다. **현재 소스에는 서버 수정 버전 감지로 이 캐시를 무효화하는 기능이 없습니다.**

일반 새로고침과 헤더의 당겨서 새로고침은 IndexedDB 캐시를 삭제하지 않습니다. 서버에서 다시 읽어야 한다면 개발자도구의 Application에서 `flfc-analysis-cache`만 삭제한 뒤 새로고침해 메모리 상태도 초기화합니다.

기록하기 데이터는 경기 종료 후에도 RTDB 구독이 유지됩니다. 분석 캐시가 있다고 해서 전체 Firebase 조회·구독이 차단되는 것은 아닙니다.

## 11. 관리자 기록 수정

한국 시간 일요일 08:00~10:00에는 `/admin`에 [AdminRoundManager.jsx](src/components/organisms/AdminRoundManager.jsx)가 표시됩니다. 이외 시간에는 3개월 이상 미참여 목록이 표시됩니다.

관리 화면에서는 라운드와 골 기록을 추가·수정·삭제하고 경기 팀·시작 시각·결과를 변경합니다. 저장 흐름은 다음과 같습니다.

1. 현재 날짜·시간, 회원 정보, 오늘 주간 팀 명단을 검증합니다.
2. 화면을 열었을 때의 원본과 저장 직전 기록을 비교합니다. 다른 사용자가 변경했다면 오래된 값으로 덮어쓰지 않고 재확인을 요구합니다.
3. 해당 날짜의 RTDB 라운드 전체 경로를 트랜잭션으로 수정합니다.
4. 최신 RTDB에서 일별 집계를 다시 계산해 Firestore에 저장합니다.
5. 집계 저장 중 새 기록이 들어왔는지 확인하고 최대 3회 재집계합니다.

RTDB 저장 성공 후 Firestore 집계가 실패하면 상세 기록은 이미 저장된 상태입니다. 집계 재시도 기능으로 복구합니다. 두 저장소에 대한 원자적 저장은 아닙니다.

변경된 RTDB는 기존 구독을 통해 기록하기 화면에도 전달됩니다. 골·어시의 로컬 편집 상태와 실제 `roundId`를 사용하므로, 화면 순번을 저장 키로 대신 사용하면 안 됩니다.

관련 파일: [adminRoundDraft.js](src/apis/adminRoundDraft.js), [adminRoundMutation.js](src/apis/adminRoundMutation.js), [adminRoundStore.js](src/apis/adminRoundStore.js), [adminRoundWrites.js](src/apis/adminRoundWrites.js).

> `/admin`을 직접 여는 것과 시간 제한은 보안 권한 검증을 대신하지 않습니다. 현재 라우트에는 Firebase 관리자 인증 가드가 보이지 않습니다. 실제 접근·쓰기 권한은 배포된 Firebase 보안 규칙과 인증 정책을 별도로 확인해야 합니다.

## 12. 공통 UI와 테스트

### 테마와 새로고침

- 헤더 왼쪽은 일반·다크 모드 전환, 오른쪽은 PLAB 팀 페이지 링크입니다.
- 선택 테마는 `localStorage`의 `flfc-theme`에 저장합니다. 직접 선택하지 않았다면 시스템 테마를 따릅니다.
- 헤더의 비인터랙티브 영역에서 아래로 당겼다가 놓으면 새로고침합니다. 입력 폼·탭 영역 전체를 대상으로 하는 제스처는 아닙니다.

관련 파일: [useTheme.js](src/hooks/useTheme.js), [theme.js](src/apis/theme.js), [usePullToRefresh.js](src/hooks/usePullToRefresh.js).

### 기록 입력과 입력 중 상태

골 등록 시 입력 폼이 페이드아웃하고 파티클 공이 왼쪽으로 이동한 뒤 퍼지며 사라집니다. 관련 파일은 [RecordEntryForm.jsx](src/components/molecules/RecordEntryForm.jsx), [ParticleRegisterButton.jsx](src/components/atoms/ParticleRegisterButton.jsx)와 각 CSS입니다.

한 행을 수정 중일 때 다른 행 수정과 새 기록 입력을 잠급니다. 이 편집 잠금은 현재 브라우저의 UI 상태이며, 전체 사용자에 대한 전역 잠금은 아닙니다.

`typing/users`는 [WriteBox.jsx](src/components/organisms/WriteBox.jsx)가 처리합니다. 2초간 입력이 없거나 화면이 숨겨지면 입력 상태를 끄고, 연결 시 `onDisconnect(...).set(false)`를 먼저 등록합니다. 사용자 ID는 `localStorage`의 `userId`입니다. 현재 소스에 10분 간격 일괄 초기화 서버 함수는 없습니다.

### 입력 UI 테스트 모드

[recordUiTestMode.js](src/config/recordUiTestMode.js):

```js
export const recordUiTestMode = true
```

`true`이면 기록하기 탭이 [RecordEntryPreview.jsx](src/components/templates/ParentTap/RecordEntryPreview.jsx)의 미리보기로 바뀝니다. 입력 UI를 확인한 후 반드시 `false`로 되돌립니다.

이 설정은 앱 전체 Firebase 격리 스위치가 아닙니다. 다른 탭의 쓰기·앱의 조회·관리자 저장까지 모두 차단하는 것으로 사용하지 않습니다. 실제 데이터 변경 검증은 별도 Firebase 프로젝트나 명시적으로 연결한 에뮬레이터 환경에서 진행합니다.

### 시간을 임의로 설정할 때

[currentTimeState.js](src/apis/currentTimeState.js)의 기본 인수를 임시로 바꿀 수 있습니다.

```js
export function createCurrentTimeState(
  currentTime = new Date('2026-10-04T08:55:00+09:00'),
) {
  // 기존 함수 본문 유지
}
```

이 경우 해당 상태 생성 함수를 사용하는 화면의 시간이 고정됩니다. 관리자·캐시 등 자체적으로 `new Date()`를 호출하는 기능까지 모두 바뀌지는 않습니다. 운영 Firebase에 연결한 상태의 시간 조작은 실제 과거 기록 쓰기를 유발할 수 있으므로 주의하고, 검증 후 원래 기본값 `new Date()`로 복구합니다.

작업 중 검증을 위해 만든 임시 테스트 파일은 검증이 끝나면 삭제합니다. 기존 운영 코드나 사용자가 만든 파일은 테스트 정리 대상으로 간주하지 않습니다.

## 13. 빌드와 배포

### 웹 앱

```powershell
npm ci
npm run build
```

기본 빌드 산출물은 `dist/`입니다. `vercel.json`은 직접 진입한 SPA 경로를 루트로 재작성합니다. 저장소에는 Firebase Hosting 설정이 없으므로, `firebase deploy`가 이 웹 앱까지 배포한다고 가정하지 않습니다.

프런트엔드 배포 환경에도 필요한 `VITE_` 환경 변수를 설정해야 합니다.

### Firebase Functions

프로젝트 루트에서 Functions 의존성을 설치하고 대상 프로젝트를 확인한 후 배포합니다. 이 문서는 배포를 실행하지 않습니다.

```powershell
npm ci --prefix functions
npx firebase use
npx firebase deploy --only functions
npx firebase functions:log
```

`.firebaserc`의 기본 프로젝트 별칭은 `flfc-d38b0`입니다. `functions/package.json`에는 Node 런타임 `22`가 선언되어 있습니다. 실제 배포 환경의 지원 런타임·프로젝트 설정은 배포 전에 확인합니다.

`createVoteData`는 한국 시간 매주 일요일 12:00에 실행되어 다음 일요일의 `vote/YYYY/MMDD`에 `{ "message": "created" }`를 저장합니다. 코드가 `set`을 사용하므로 같은 경로의 데이터가 이미 있다면 교체될 수 있습니다. `prepareWeeklyNews`는 일요일 10시 이후 클라이언트가 호출하는 연결 확인 함수이며 AI 생성이나 경기 종료 확정을 수행하지 않습니다.

Functions 에뮬레이터 실행:

```powershell
npx firebase emulators:start --only functions
```

Functions 에뮬레이터 실행만으로 프런트엔드 Firestore·RTDB가 테스트 환경에 연결되지는 않습니다. 현재 `firebase.js`에는 Firestore·RTDB 에뮬레이터 연결 코드가 없습니다.

### 별도 축구공 실험

`package.json`에 `dev:football`, `build:football` 스크립트가 남아 있지만 현재 루트에는 `football.html`, `vite.football.config.js`가 없습니다. 기본 앱 실행·배포 절차와 구분하고, 이 스크립트를 정상 동작한다고 가정하지 않습니다.

## 14. 운영 주의사항과 문제 확인

### 데이터 수정 전 확인

1. Firebase 대상 프로젝트와 날짜를 확인합니다. `weeklyTeam`은 `YYMMDD`, 집계는 `YYYY/MMDD`, 라운드는 `YYYY/MMDD_rounds`입니다.
2. 수정 전 관련 명단·라운드·집계 데이터를 백업합니다.
3. 상세 기록의 선수명, 득점 팀, `participant`, `winnerTeam`의 일관성을 확인합니다.
4. RTDB 상세만 수정했다면 Firestore 일별 집계도 맞춰야 합니다. 현재 코드에 모든 직접 수정을 자동 집계하는 서버 트리거는 없습니다.
5. 캐시가 적용되는 화면과 실시간 구독 화면을 구분해 확인합니다.
6. Daily MVP·히스토리처럼 별도 저장된 파생 기록도 필요에 따라 점검합니다.

### 증상별 확인 위치

| 증상 | 확인할 사항 |
| --- | --- |
| 새로고침 직후 현황판이 비어 보임 | 연도 기록·회원 목록 로딩, `StatusBoard`의 유효 데이터 판정, Firestore 오류 |
| 다른 분기 수치가 보임 | `useAnalysisSeason`의 이전 시즌 대체 여부와 화면에 표시된 연도·분기 |
| 친해지자 합작 골이 과도함 | 개인 공격포인트 합계가 아닌 조합별 합작 골인지, 같은 팀 날짜·이름 해석 확인 |
| 풀네임·외자 기록이 누락됨 | `members/members`, `oneCharacter`, `nickName`, `recordMembers.js` 확인 |
| 부상중 뱃지가 안 보임 | `members/info`의 키가 풀네임인지, `injured`가 문자열이 아닌 불리언 `true`인지 확인 |
| 히스토리 헤더만 보임 | `YYYY_1st` 등 문서 ID, `point_king` 등 필드명, 수상자 문자열·배열 확인 |
| 3팀 통계가 보이거나 안 보임 | 빈 문자열이 아닌 3팀 명단, 라운드의 팀 번호·승패 기록 확인 |
| 수정했는데 분석에 이전 값이 보임 | 일요일 여부와 `flfc-analysis-cache` 유효 기간 확인 |
| 관리자 저장 후 현황판만 이전 값임 | RTDB 저장과 Firestore 집계 중 어느 단계가 실패했는지 확인 후 집계 재시도 |
| `typing/users`가 true로 남음 | 연결 정리 등록, 화면 숨김 처리, 오래된 클라이언트 상태 확인 |
| 로컬 서버가 계속 접속됨 | 실제 실행 터미널·프로세스·리스닝 포트를 확인. 브라우저 탭만 닫아서는 서버가 종료되지 않음 |

### 소스 기준의 주의점

- `/dev`에는 컬렉션 복사와 `members/info` 전체 교체 헬퍼가 있습니다. 현재 버튼에는 연결되어 있지 않지만, 연결하거나 실행하기 전에 쓰기 범위를 확인합니다.
- 기존 수정 요청 관련 컴포넌트·구독·경로가 남아 있습니다. 완전히 제거된 기능으로 문서화하거나 해당 경로를 임의로 삭제하지 않습니다.
- 실제 Firestore·RTDB 보안 규칙 파일은 현재 저장소 설정에서 확인되지 않습니다. UI의 시간 제한만으로 운영 데이터가 보호된다고 가정하지 않습니다.
- 빌드에서 CSS nesting, Browserslist 데이터, 큰 번들 관련 경고가 나올 수 있습니다. 성공 여부와 경고를 구분합니다.
- `AnalysisTap.jsx`의 기존 Hook 의존성 경고가 남아 있어 `npm run lint`는 경고 제한 때문에 실패할 수 있습니다.

기능이나 데이터 경로를 변경할 때는 해당 코드와 이 위키를 함께 갱신합니다. 배포 상태와 비용·보안 정책은 소스만으로 확정하지 않습니다.
