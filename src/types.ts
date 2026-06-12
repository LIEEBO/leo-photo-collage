// ─── 画布尺寸 ────────────────────────────────────────────────────────────────
export interface CanvasDimensions {
  width: number;
  height: number;
  aspect: number;
}

// ─── 图片变换状态 ────────────────────────────────────────────────────────────
export interface TransformState {
  scale: number;
  rotate: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_TRANSFORM: TransformState = {
  scale: 1,
  rotate: 0,
  offsetX: 0,
  offsetY: 0,
};

// ─── 布局格子 ────────────────────────────────────────────────────────────────
export interface CellLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── 分割线 ──────────────────────────────────────────────────────────────────
export interface DividerLayout {
  type: 'col' | 'row';
  pos: number;
  span: [number, number];
}

// ─── 画布比例选项 ────────────────────────────────────────────────────────────
export type AspectRatio = '3:4' | '1:1' | '9:16' | '2:3' | '1:2' | '4:3' | '3:2' | '16:9';

export const ASPECT_RATIOS: AspectRatio[] = [
  '3:4', '1:1', '9:16', '2:3', '1:2', '4:3', '3:2', '16:9',
];

// ─── 模板信息 ────────────────────────────────────────────────────────────────
export interface TemplateInfo {
  id: number;
  label: string;
}

export const TEMPLATES: TemplateInfo[] = [
  { id: 0, label: '矩阵均分' },
  { id: 1, label: '左大右小' },
  { id: 2, label: '横向竖条' },
  { id: 3, label: '纵向横条' },
  { id: 4, label: '上大下小' },
  { id: 5, label: '下大上小' },
  { id: 6, label: '右大左小' },
  { id: 7, label: '三明治' },
  { id: 8, label: '顶横+底分' },
  { id: 9, label: '黄金螺旋' },
];
