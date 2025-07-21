import type { Subject } from "../types/SubjType";

export const testForIdx = (pInfos: Subject[]) => {
  pInfos = pInfos
    .filter(
      (pInfo, index) =>
        index === pInfos.findIndex((qInfo) => qInfo.idx === pInfo.idx)
    )
    .sort((a, b) => a.idx - b.idx);
};

export const testForMom = (pInfos: Subject[]) => {
  let restIdxs = new Set(pInfos.map((info) => info.idx));
  let safeIdxs = new Set([-1]);
  let fmlyIdxs: Set<number> = new Set([]);
  let i: number = restIdxs.values().next().value ?? -1;
  let m: number;

  while (restIdxs.size > 0) {
    if (i < 0) break; // restIdxs is empty.
    restIdxs.delete(i);
    fmlyIdxs.add(i);
    m = pInfos.find((info) => info.idx === i)?.mom ?? -1;
    if (i === m || !restIdxs.has(m)) {
      pInfos = pInfos.map((info) =>
        info.idx === i ? { ...info, mom: -1 } : info
      );
      m = -1;
    } // No mom.
    if (safeIdxs.has(m)) {
      for (const x of fmlyIdxs) {
        safeIdxs.add(x);
      }
      i = restIdxs.values().next().value ?? -1;
    } // Reach the -1.
    else {
      i = pInfos.find((info) => info.idx === m)?.idx ?? -1;
    }
  }
};

function testForBro(pInfos: Subject[]): Subject[] {
  // const result: Subject[] = [];

  // 1. grp별로 그룹핑
  // const groups = new Map<number, Subject[]>();
  // for (const item of pInfos) {
  //   if (!groups.has(item.mom)) {
  //     groups.set(item.mom, []);
  //   }
  //   groups.get(item.mom)!.push(item);
  // }

  const pMoms = new Set(pInfos.map((info) => info.mom));

  // for (const [grp, groupItems] of groups.entries()) {
  for (const mom of pMoms) {
    const mInfos = pInfos.filter((info) => info.mom === mom);
    const mIdxs = new Set(mInfos.map((info) => info.idx));
    const usedPrev = new Set<number>();
    const fixedGroup: Subject[] = [];

    // 2. 시작 노드 정하기: prev === -1인 것들
    const roots = mInfos.filter((info) => info.bro === -1);

    let rootItem: Subject;
    if (roots.length === 0) {
      // 시작 노드가 없으면 강제로 하나 지정
      rootItem = mInfos[0];
      rootItem.bro = -1;
    } else if (roots.length > 1) {
      // 여러 개면 하나만 남기고 나머지는 임의로 재연결
      rootItem = roots[0];
      for (let i = 1; i < roots.length; i++) {
        roots[i].bro = rootItem.idx; // 연결시켜버림
      }
    } else {
      rootItem = roots[0];
    }

    usedPrev.add(-1);
    fixedGroup.push(rootItem);

    // 3. 나머지 아이템 순회하면서 고치기
    for (const item of groupItems) {
      if (item.idx === rootItem.idx) continue;

      // prev가 같은 grp 내의 id인지 확인
      if (!mIdxs.has(item.bro) || item.bro === item.idx) {
        item.bro = rootItem.idx;
      }

      // prev 중복 제거
      if (usedPrev.has(item.bro)) {
        // 겹치면 root에 연결
        item.bro = rootItem.idx;
        while (usedPrev.has(item.bro)) {
          // 최후의 수단: -1
          item.bro = -1;
        }
      }

      usedPrev.add(item.bro);
      fixedGroup.push(item);
    }

    result.push(...fixedGroup);
  }

  return result;
}
