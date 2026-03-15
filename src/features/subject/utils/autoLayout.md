# autoLayout.ts 작성 요청

## 목적

- computeAutoLayout의 목적은 SbjCnvsItem(이하 노드)들이 서로 겹치지 않고 SbjCnvsCrv(이하 엣지)들이 가능한 서로 교차하지 않으며 전체적으로 노드들의 간격이 compact하게 배치되도록 하는 것이다.

## 정의 및 전제

- 임의의 노드 A, B에 대해, 엣지 A→B가 부여될 수 있다.
- B.pre = {x | x→B}이다.
- A.nxt = {x | A→x}이다.
- B.preSet = {x | x→...→B}이다. 따라서, B.pre는 B.preSet의 subset이다.
- A.nxtSet = {x | A→...→x}이다. 따라서, A.nxt는 A.nxtSet의 subset이다.
- B.pre가 empty이면 B는 source라 한다.
- A.nxt가 empty이면 A는 sink라 한다.
- idx2chain는 idx -> {pre, nxt, preSet, nxtSet} 매핑이다.
- idx2sbj는 idx -> {x, y, ...} 매핑으로, x, y는 현재 노드 중앙의 위치를 의미한다.
- sizes는 idx -> {w, h} 매핑으로, w, h는 노드의 가로, 세로 길이를 의미한다.
- partition은 →로 연결된 노드들로 partition을 나눈 것이다.
- 각 노드는 level이 부여되며, idx2level은 idx -> level 매핑이다.
- level의 최소값은 0이다.
- A.level = B.level이고, A.nxt와 B.nxt의 교집합이 non-empty일 때, A와 B를 친척이라 부른다. A와 B가 친척이면 A와 B는 당연히 같은 partition에 속한다.
- A.level = B.level이고, A.nxt와 B.nxt의 교집합이 empty이고 A와 B가 같은 partition에 속할 때, A와 B를 이웃이라 부른다.
- A.nxt에 속하는 노드들을 envelope하는 직사각형을 A.house라 쓴다.

## 무조건 따라야 하는 규칙

1. 같은 level의 노드들은 같은 y를 갖는다.
2. A.level < B.level이면 A.y < B.y이다.
3. 한 partition 내에서 임의의 level n에 대해 level이 n인 노드들과 level이 n+1인 노드들 사이의 간격 중 가장 작은 값은 LAYOUT_ROW_GAP이어야 한다. 만약 partition이 다르거나 인접한 level이 아닐 경우 이 규칙은 무시한다.
4. 한 partition 내에서 같은 level의 노드들은 최소 LAYOUT_COLUMN_GAP 이상의 간격을 유지해야 한다.
5. 서로 다른 두 partition의 노드들은 최소 LAYOUT_PARTITION_GAP 이상의 간격을 유지해야 한다.
6. A와 B가 이웃이면, A.house와 B.house는 최소 LAYOUT_COLUMN_GAP 이상의 간격을 유지해야 한다.
7. A.nxt가 non-empty이고 A의 친척이 없을 때, A.x는 A.house의 중앙의 x좌표와 같아야 한다. A.nxt의 노드들의 위치가 조정될 경우 A의 위치도 같이 조정되어야 한다.
8. 최종적으로 모든 노드들을 envelop하는 직사각형의 중앙 위치가 원점이 되도록 normalize 한다.

## 적절한 조정이 필요한 규칙

9. {A, ..., B}가 친척일 때, A.x, ..., B.x는 각각 A.house, ..., B.house의 중앙의 x좌표를 기본으로 한다.
10. 단, 규칙 9가 규칙 4, 5를 위반하는 경우 A.x, ..., B.x를 적절히 조정할 수 있다.
11. 만약 규칙 10의 조정으로 인해 {A, ..., B}에 속하는 노드 C가 이웃인 노드 X에 대해서 정렬 규칙 4, 5를 위반하게 될 경우 위치를 적절히 조정한다. 단, {A, ..., B}와 그 nxtSet에 속하는 노드들의 x는 한꺼번에 동일하게 조정하고, C와 C.nxtSet에 속하는 노드들의 x는 한꺼번에 동일하게 조정한다.
12. 규칙 9, 10, 11, 12, 또는 이 문서에 기술하지 않은 이유로 인해 임의의 노드의 x가 변경될 경우 규칙 7에 따른 위치 조정이 필요하다.
13. 한 partition에서 같은 level에 있는 노드들의 순서는 위 규칙을 위반하지 않는 선에서 원래의 위치에 따른 순서를 가능한 보존한다.
14. 위 규칙을 위반하지 않는 선에서 모든 노드들은 compact하게 배치되어야 한다. 즉, 모든 노드들을 envelop하는 직사각형의 가로길이를 최소화 해야 한다.
