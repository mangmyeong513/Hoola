# Hoola UI Remaster

리액트 + Vite 기반으로 제작한 훌라 UI 리뉴얼입니다. 기존 게임 로직과 연동하기 위한 이벤트 훅과 3D/2D 전환, 모바일/데스크탑 분리 레이아웃을 제공합니다.

## 설치 & 실행

```bash
pnpm install # 또는 npm install / yarn
pnpm dev     # http://localhost:5173 에서 실행
```

> 3D 렌더링은 WebGL을 사용합니다. 로컬 개발 시 GPU 가속이 가능한 브라우저를 권장합니다.

## 레이아웃 & 페이지 구조

- `/` (로비): 플레이어 닉네임, 인원 설정 후 방 생성/참여 UI.
- `/table`: 데스크탑은 3D 테이블, 모바일은 플랫 탑다운 테이블로 자동 전환. HUD 버튼으로 드로우/버림/땡큐/등록/붙이기를 제공하며, 7 단독 등록 시 전용 배지가 표시됩니다.
- `/round`: 라운드 요약 및 로그.
- `/settings`: 그래픽 퀄리티, 3D 테이블 on/off, 모바일 레이아웃 강제 옵션.

탑(데스크탑) / 하단(모바일) 탭 네비게이션으로 페이지를 전환하며, 스크롤 없이 구획이 분리됩니다.

## 모바일 강제 모드

`설정 > 모바일 레이아웃 강제` 토글을 사용하거나 `zustand` 스토어의 `toggleForceMobile(true)`를 호출하면 강제로 모바일 UI가 적용됩니다.

## 3D 성능 옵션

- `설정 > 3D 테이블 활성화` 토글로 즉시 전환.
- 모바일에서는 기본적으로 3D가 비활성화되며, 토글을 켜면 데스크탑과 동일한 3D 테이블을 표시합니다.
- `src/ui/three`에서 조명/카메라/메시 구성을 조정할 수 있습니다.

## 네트워크 이벤트 연동

`src/net.ts`의 `emit`/`on`을 사용해 게임 서버 이벤트를 바인딩합니다.

- `player:join` → 토스트 + 좌석 아이콘 애니메이션.
- `player:leave` → 토스트 + 플레이어 제거.
- `deck:reshuffle` → 재섞기 토스트.

게임 로직에서 `useStore.getState()`를 통해 `showSevenBadge`, `setMeldHint`, `openThankYou` 등 UI 액션을 호출할 수 있습니다.

## 3D 에셋 대체 방법

- `/public/models/card.glb`가 존재하면 자동 로드합니다.
- 모델이 없을 경우 `Card3D`가 코드 기반 ShapeGeometry로 카드를 생성합니다.
- 테이블 질감은 `/public/textures/felt.jpg`를 사용하며, 없다면 자동으로 단색 재질로 대체됩니다.

## 테스트

- `pnpm test`: 유닛 테스트 (라우터 전환, 뷰 모드 레이아웃, 토스트 큐)
- `pnpm test:ui`: 간단한 비주얼 회귀 스냅샷 테스트(Table3D 모바일/데스크탑)

테스트는 Vitest + Testing Library + jsdom 환경에서 실행되며, CSS를 로드해 레이아웃 클래스를 확인합니다.
