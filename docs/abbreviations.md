# Abbreviation Reference

프로젝트 전반에서 사용하는 약어 목록입니다.
새 약어를 추가할 때는 이 문서를 먼저 확인하고, 없으면 추가하세요.

---

## Components / Features

| 약어 | 원형 | 사용 예 |
| --- | --- | --- |
| `Sbj` | Subject | `SbjCnvs`, `SbjTree`, `useSbjData` |
| `Crs` | Course | `SbjCnvsCrs`, `SbjCnvsCrsContainer` |
| `Cnvs` | Canvas | `SbjCnvs`, `SbjCnvsItem` |
| `Bttn` | Button | `BttnDel`, `BttnPM`, `BttnGrp` |
| `Chk` | Check | `BttnChk` |
| `Del` | Delete | `BttnDel` |
| `Grp` | Group | `BttnGrp` |
| `Vert` | Vertical | `BttnVert` |
| `PM` | Plus/Minus | `BttnPM` |

## Data / Types

| 약어 | 원형 | 사용 예 |
| --- | --- | --- |
| `Idx` | Index | `IdxItem`, `idx2sbj` |
| `Fam` | Family (tree structure) | `FamilyMap`, `idx2family` |
| `Crud` | Create/Read/Update/Delete | `useSbjCrud` |
| `Sync` | Synchronize | `useSbjSync`, `SbjSyncContext` |
| `Codec` | Encoder + Decoder | `curriculumCodec` |
| `Op` | Operations (pure functions) | `curriculumOp`, `familyOp` |

## Domain (tree / graph relationships)

| 약어 | 원형 | 사용 예 |
| --- | --- | --- |
| `Mom` | Mother (parent node) | `setMom`, `FamilyInfo.mom` |
| `Bro` | Brother (sibling node) | `setBro`, `BroDir` |
| `Pre` | Prerequisite | `setPre`, `ChainInfo.pre` |
| `Pos` | Post-requisite | `setCnvsPos` |

## CSS Classes

| 약어 | 원형 | 사용 예 |
| --- | --- | --- |
| `slc` | selected | `.-slc` |
| `pre` | prerequisite highlight | `.-pre` |
| `nxt` | next (post-req) highlight | `.-nxt` |
| `ovr` | over (drag-over) | `.-ovr` |
| `ttl` | title | `.ttl` |

## SVG / Graphics Constants (`BttnConstants.ts`)

| 약어 | 원형 | 설명 |
| --- | --- | --- |
| `sz` | size | SVG 크기 (px) |
| `rad` | radius | 모서리 반지름 |
| `th` | thickness | 선 두께 |
| `pos` | position | 정규화 좌표(-1~1) → SVG 픽셀 좌표 변환 함수 |
