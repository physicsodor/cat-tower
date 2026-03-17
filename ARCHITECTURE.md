# Architecture

## 개요

커리큘럼 시각화 편집기. 과목(Subject)과 코스(Course)를 무한 캔버스 위에서 편집하며, 계층 트리와 선수과목 그래프를 동시에 관리한다.

---

## 데이터 모델 (3-layer)

```
Curriculum = Subject | Course

Subject: Family & Chain & { x, y }  → 캔버스에 렌더링됨
Course:  Family only                 → 캔버스에 렌더링 안 됨 (과목 묶음 역할)
```

세 레이어는 독립적이다:
- **Family** (`mom`, `bro`): 트리 계층 구조. `bro`는 fractional-indexing 문자열로 재정렬 가능.
- **Chain** (`pre: Set<number>`): 선수과목 DAG. `idx`로 참조.
- **Spatial** (`x`, `y`): 캔버스 위치.

**Source of truth:** `useHistory` 내부의 `list: ReadonlyArray<Curriculum>`

**Derived maps (useMemo로 재계산):**
- `idx2sbj: SbjMap` — 렌더링용 최소 정보
- `idx2family: FamilyMap` — `mom`, `bro`, `kids`, 형제 경계
- `idx2chain: ChainMap` — `pre`, `nxt`, 전이 폐포 `preSet`/`nxtSet`

---

## Context 구조

```
SbjContainer
└── SbjProvider
    ├── SbjDataContext  ← 메인 상태 + 모든 CRUD/캔버스/트리 operations
    ├── SbjSelectContext ← 선택 상태 (selectedSet, selectItem, selectMany)
    └── SbjSyncContext  ← Supabase 영속성, 프로젝트 관리
```

---

## 주요 설계 패턴

### Ref Bridge
콜백이 최신 상태를 참조하되 클로저 문제를 피하기 위해 ref 동기화 사용:
```ts
const selectedSetRef = useRef(selectedSet)
useEffect(() => { selectedSetRef.current = selectedSet }, [selectedSet])
```
`listRef`, `cameraRef`, `selectedSetRef` 등이 이 패턴.

### GetSet 패턴 (`src/types/GetSet.ts`)
드래그 등 비반응형 상태에 사용. 변경 시 리렌더 없음:
```ts
type GetSet<T> = { get: () => T; set: (x: T) => void }
```
`treeDragRef`, `cnvsDragRef`, `preSourceRef`, `cameraRef`가 이 패턴.

### ReadOnly 타입
`ReadonlyArray`, `ReadonlySet`, `ReadonlyMap` 사용. 불변 업데이트(spread, `.map()`) 원칙.

---

## 캔버스 컴포넌트 계층

```
SbjCnvs (카메라 동기화, 버튼)
└── InfiniteCanvas (pan/zoom/drag/marquee, 좌표계 변환)
    └── SbjCnvsInner (카메라 적용)
        ├── SbjCnvsCrsContainer  → SbjCnvsCrs × n    (코스 박스, 배경/전경 2회)
        ├── SbjCnvsCurveContainer → SbjCnvsCurve × m  (SVG 선수관계 화살표)
        └── SbjCnvsItemContainer → SbjCnvsItem × k   (과목 노드)
```

**좌표계:**
- World: `Subject.x`, `Subject.y`
- View: `camera.x + worldX * zoom + dxy.dx` (드래그 중 선택 항목에만 dxy 적용)
- Screen: `transform: translate(viewX, viewY) scale(zoom) translate(-50%, -50%)`

**BBox (`useBBoxMap`):**
- Subject: `getBoundingClientRect()` → 뷰포트 기준 → 월드 좌표로 역변환
- Course: 자식들의 BBox를 재귀적으로 union

---

## Auto-Layout 알고리즘 (`autoLayout.ts`)

입력: `bboxMap: Map<number, BBox>`, `idx2chain`
출력: `Map<number, { x, y }>`

1. **파티션 분리** — 무방향 그래프 기준 연결 컴포넌트 분리
2. **레벨 배정** — ASAP(forward)/ALAP(backward) 스케줄링의 절충
   - 그래프가 일관적이면 tight BFS 사용
   - 아니면 `(asap + alap) / 2` 반올림
3. **Y 배정** — 레벨별 행 높이(max) + `LAYOUT_ROW_GAP(32px)` 간격
4. **X 배정 (bilateral sweep)** — `layoutBlock` 재귀 호출
   - median heuristic: 부모는 자식들의 중앙값에 정렬
   - forward pass → backward pass로 위치 조정
5. **파티션 배치** — 파티션 간 `LAYOUT_PART_GAP(64px)` 간격
6. **정규화** — 레벨 0 기준 정렬, 전체 (0,0) 중심화

**핵심 상수:**
- `LAYOUT_ROW_GAP = 32` (px, rem=16)
- `LAYOUT_COL_GAP = 24`
- `LAYOUT_PART_GAP = 64`

---

## Hooks 역할 요약

| Hook | 역할 |
|---|---|
| `useHistory` | undo/redo (circular buffer 50개), `setList`/`undo`/`redo`/`loadList` |
| `useSbjCrud` | 과목/코스 추가·삭제 |
| `useSbjTree` | `setTreeMom` (부모 변경), `setTreeBro` (형제 순서 변경) |
| `useSbjCnvs` | `setCnvsPos` (드래그), `setCnvsPre` (선수관계 설정), `autoLayout` |
| `useSbjClipboard` | copy/paste/cut, 단축키(Ctrl+C/V/X/Z/Y, Delete) |
| `useSbjSync` | Supabase 저장/불러오기, URL 공유 (base64 압축) |
| `useBBoxMap` | DOM 기반 BBox 계산, `useLayoutEffect`로 paint 전 업데이트 |

---

## 비직관적 제약사항

- **Course는 캔버스에 렌더링되지 않는다.** 코스 박스는 자식 Subject들의 BBox union으로 그려질 뿐, 코스 자체에 x/y가 없다.
- **선수관계(pre) 설정 워크플로:** output dot 클릭 → `preSource` ref에 저장 → input dot에 drop → `setCnvsPre` 호출.
- **dxy는 선택된 항목에만 실시간 적용된다.** 드래그 종료 시(`onItemDragEnd`) `setCnvsPos`로 확정.
- **ChainMap의 전이 폐포**(`preSet`/`nxtSet`)는 list 갱신 시마다 완전 재계산된다. 이 덕분에 하이라이트 등에서 별도 탐색 불필요.
