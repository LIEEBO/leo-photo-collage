import type {
  CanvasDimensions,
  AspectRatio,
  CellLayout,
  DividerLayout,
} from '../types';

// ─── 画布尺寸计算器 ──────────────────────────────────────────────────────────
export const getCanvasDimensions = (ratio: string): CanvasDimensions => {
  const b = 420; // 预览基准高度
  const map: Record<string, CanvasDimensions> = {
    '1:1':  { width: b,        height: b, aspect: 1       },
    '3:4':  { width: b * 0.75,  height: b, aspect: 0.75    },
    '9:16': { width: b * 0.5625, height: b, aspect: 0.5625  },
    '2:3':  { width: b * 0.666,  height: b, aspect: 0.666   },
    '1:2':  { width: b * 0.5,    height: b, aspect: 0.5     },
    '4:3':  { width: b * 1.333, height: b, aspect: 1.333   },
    '3:2':  { width: b * 1.5,   height: b, aspect: 1.5     },
    '16:9': { width: b * 1.777, height: b, aspect: 1.777   },
  };
  return map[ratio] ?? { width: b, height: b, aspect: 1 };
};

// ─── 动态布局计算 ────────────────────────────────────────────────────────────
export const getDynamicLayout = (
  count: number,
  tpl: number,
  col: number,
  row: number
): { cells: CellLayout[]; dividers: DividerLayout[] } => {
  const cells: CellLayout[] = [];
  const dividers: DividerLayout[] = [];

  if (count <= 0) return { cells, dividers };
  if (count === 1) {
    cells.push({ x: 0, y: 0, w: 100, h: 100 });
    return { cells, dividers };
  }

  if (tpl === 0) {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const isLast = r === rows - 1;
      const itemsInRow = isLast ? count - r * cols : cols;
      const w = 100 / itemsInRow;
      const h = 100 / rows;
      cells.push({ x: c * w, y: r * h, w, h });
    }
    for (let r = 1; r < rows; r++)
      dividers.push({ type: 'row', pos: r * (100 / rows), span: [0, 100] });
    for (let r = 0; r < rows; r++) {
      const isLastRow = r === rows - 1;
      const itemsInRow = isLastRow ? count - r * cols : cols;
      const rh = 100 / rows;
      for (let c = 1; c < itemsInRow; c++)
        dividers.push({ type: 'col', pos: c * (100 / itemsInRow), span: [r * rh, (r + 1) * rh] });
    }
  }
  else if (tpl === 1) {
    cells.push({ x: 0, y: 0, w: col, h: 100 });
    dividers.push({ type: 'col', pos: col, span: [0, 100] });
    const rightCount = count - 1;
    if (rightCount > 0) {
      if (rightCount <= 3) {
        const rh = 100 / rightCount;
        for (let i = 0; i < rightCount; i++) cells.push({ x: col, y: i * rh, w: 100 - col, h: rh });
        for (let i = 1; i < rightCount; i++) dividers.push({ type: 'row', pos: i * rh, span: [col, 100] });
      } else {
        const subCols = 2;
        const subRows = Math.ceil(rightCount / subCols);
        const sw = (100 - col) / subCols;
        const sh = 100 / subRows;
        for (let i = 0; i < rightCount; i++) {
          const r = Math.floor(i / subCols);
          const c = i % subCols;
          cells.push({ x: col + c * sw, y: r * sh, w: sw, h: sh });
        }
        for (let r = 1; r < subRows; r++) dividers.push({ type: 'row', pos: r * sh, span: [col, 100] });
        for (let r = 0; r < subRows; r++) dividers.push({ type: 'col', pos: col + sw, span: [r * sh, (r + 1) * sh] });
      }
    }
  }
  else if (tpl === 2) {
    const w = 100 / count;
    for (let i = 0; i < count; i++) cells.push({ x: i * w, y: 0, w, h: 100 });
    for (let i = 1; i < count; i++) dividers.push({ type: 'col', pos: i * w, span: [0, 100] });
  }
  else if (tpl === 3) {
    const h = 100 / count;
    for (let i = 0; i < count; i++) cells.push({ x: 0, y: i * h, w: 100, h });
    for (let i = 1; i < count; i++) dividers.push({ type: 'row', pos: i * h, span: [0, 100] });
  }
  else if (tpl === 4) {
    cells.push({ x: 0, y: 0, w: 100, h: row });
    dividers.push({ type: 'row', pos: row, span: [0, 100] });
    const btmCount = count - 1;
    if (btmCount > 0) {
      const bw = 100 / btmCount;
      for (let i = 0; i < btmCount; i++) cells.push({ x: i * bw, y: row, w: bw, h: 100 - row });
      for (let i = 1; i < btmCount; i++) dividers.push({ type: 'col', pos: i * bw, span: [row, 100] });
    }
  }
  else if (tpl === 5) {
    const topCount = count - 1;
    if (topCount > 0) {
      const tw = 100 / topCount;
      for (let i = 0; i < topCount; i++) cells.push({ x: i * tw, y: 0, w: tw, h: row });
      for (let i = 1; i < topCount; i++) dividers.push({ type: 'col', pos: i * tw, span: [0, row] });
    }
    cells.push({ x: 0, y: row, w: 100, h: 100 - row });
    dividers.push({ type: 'row', pos: row, span: [0, 100] });
  }
  else if (tpl === 6) {
    const leftCount = count - 1;
    if (leftCount > 0) {
      if (leftCount <= 3) {
        const lh = 100 / leftCount;
        for (let i = 0; i < leftCount; i++) cells.push({ x: 0, y: i * lh, w: col, h: lh });
        for (let i = 1; i < leftCount; i++) dividers.push({ type: 'row', pos: i * lh, span: [0, col] });
      } else {
        const subCols = 2;
        const subRows = Math.ceil(leftCount / subCols);
        const sw = col / subCols;
        const sh = 100 / subRows;
        for (let i = 0; i < leftCount; i++) {
          const r = Math.floor(i / subCols);
          const c = i % subCols;
          cells.push({ x: c * sw, y: r * sh, w: sw, h: sh });
        }
        for (let r = 1; r < subRows; r++) dividers.push({ type: 'row', pos: r * sh, span: [0, col] });
        for (let r = 0; r < subRows; r++) dividers.push({ type: 'col', pos: sw, span: [r * sh, (r + 1) * sh] });
      }
    }
    cells.push({ x: col, y: 0, w: 100 - col, h: 100 });
    dividers.push({ type: 'col', pos: col, span: [0, 100] });
  }
  else if (tpl === 7) {
    if (count <= 2) {
      const w = 100 / count;
      for (let i = 0; i < count; i++) cells.push({ x: i * w, y: 0, w, h: 100 });
    } else {
      const leftW = col / 2, rightW = col / 2, midW = 100 - col;
      const leftCount = Math.floor((count - 1) / 2), rightCount = count - 1 - leftCount;
      const lh = 100 / Math.max(leftCount, 1);
      for (let i = 0; i < leftCount; i++) cells.push({ x: 0, y: i * lh, w: leftW, h: lh });
      cells.push({ x: leftW, y: 0, w: midW, h: 100 });
      const rh = 100 / Math.max(rightCount, 1);
      for (let i = 0; i < rightCount; i++) cells.push({ x: leftW + midW, y: i * rh, w: rightW, h: rh });
      dividers.push({ type: 'col', pos: leftW, span: [0, 100] }, { type: 'col', pos: leftW + midW, span: [0, 100] });
    }
  }
  else if (tpl === 8) {
    if (count <= 2) {
      const h = 100 / count;
      for (let i = 0; i < count; i++) cells.push({ x: 0, y: i * h, w: 100, h });
    } else {
      cells.push({ x: 0, y: 0, w: 100, h: row });
      dividers.push({ type: 'row', pos: row, span: [0, 100] });
      const btmCount = count - 1;
      const bw = 100 / btmCount;
      for (let i = 0; i < btmCount; i++) cells.push({ x: i * bw, y: row, w: bw, h: 100 - row });
      for (let i = 1; i < btmCount; i++) dividers.push({ type: 'col', pos: i * bw, span: [row, 100] });
    }
  }
  else if (tpl === 9) {
    if (count === 2) {
      cells.push({ x: 0, y: 0, w: col, h: 100 }, { x: col, y: 0, w: 100 - col, h: 100 });
      dividers.push({ type: 'col', pos: col, span: [0, 100] });
    } else {
      cells.push({ x: 0, y: 0, w: col, h: row });
      dividers.push({ type: 'col', pos: col, span: [0, row] }, { type: 'row', pos: row, span: [0, 100] });
      const restCount = count - 1, rightN = Math.ceil(restCount / 2), btmN = restCount - rightN;
      const rh = row / Math.max(rightN, 1);
      for (let i = 0; i < rightN; i++) cells.push({ x: col, y: i * rh, w: 100 - col, h: rh });
      for (let i = 1; i < rightN; i++) dividers.push({ type: 'row', pos: i * rh, span: [col, 100] });
      if (btmN > 0) {
        const bw = 100 / btmN;
        for (let i = 0; i < btmN; i++) cells.push({ x: i * bw, y: row, w: bw, h: 100 - row });
        for (let i = 1; i < btmN; i++) dividers.push({ type: 'col', pos: i * bw, span: [row, 100] });
      }
    }
  }

  return { cells, dividers };
};

// ─── 判断是否为触屏设备 ──────────────────────────────────────────────────────
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
