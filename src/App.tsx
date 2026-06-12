import React, { useState, useRef, useEffect } from 'react';

// ─── 画布尺寸计算器 ──────────────────────────────────────────────────────────
const getCanvasDimensions = (ratio: string) => {
  const b = 420; // 预览基准高度
  const map: Record<string, { width: number; height: number; aspect: number }> = {
    '1:1':  { width: b,        height: b, aspect: 1       },
    '3:4':  { width: b*.75,    height: b, aspect: .75      },
    '9:16': { width: b*.5625,  height: b, aspect: .5625    },
    '2:3':  { width: b*.666,   height: b, aspect: .666     },
    '1:2':  { width: b*.5,     height: b, aspect: .5       },
    '4:3':  { width: b*1.333,  height: b, aspect: 1.333    },
    '3:2':  { width: b*1.5,    height: b, aspect: 1.5      },
    '16:9': { width: b*1.777,  height: b, aspect: 1.777    },
  };
  return map[ratio] ?? { width: b, height: b, aspect: 1 };
};

interface TransformState { scale: number; rotate: number; offsetX: number; offsetY: number; }
const DEFAULT_TRANSFORM: TransformState = { scale: 1, rotate: 0, offsetX: 0, offsetY: 0 };

interface CellLayout { x: number; y: number; w: number; h: number; }
interface DividerLayout { type: 'col' | 'row'; pos: number; span: [number, number]; }

const getDynamicLayout = (count: number, tpl: number, col: number, row: number) => {
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

export default function App() {
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [templateIndex, setTemplateIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedGridIndex, setSelectedGridIndex] = useState<number | null>(null);
  const [transforms, setTransforms] = useState<Record<number, TransformState>>({});
  
  const [colPercent, setColPercent] = useState<number>(50);
  const [rowPercent, setRowPercent] = useState<number>(50);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [potentialSwapIndex, setPotentialSwapIndex] = useState<number | null>(null);

  const [imageAspects, setImageAspects] = useState<Record<number, number>>({});

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isWorkspacePanning, setIsWorkspacePanning] = useState(false);

  const [mobileScale, setMobileScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { images.forEach(u => URL.revokeObjectURL(u)); };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!workspaceRef.current) return;
      const wWidth = workspaceRef.current.clientWidth - 32;
      const wHeight = workspaceRef.current.clientHeight - 32;
      const currentCanvas = getCanvasDimensions(aspectRatio);
      
      let factor = 1;
      if (currentCanvas.width > wWidth || currentCanvas.height > wHeight) {
        factor = Math.min(wWidth / currentCanvas.width, wHeight / currentCanvas.height);
      }
      setMobileScale(factor);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [aspectRatio, images.length]);

  useEffect(() => {
    const dn = (e: KeyboardEvent) => { if (e.code==='Space' && document.activeElement?.tagName!=='INPUT') { e.preventDefault(); setIsSpacePressed(true); } };
    const up = (e: KeyboardEvent) => { if (e.code==='Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  const getTransform = (idx: number) => transforms[idx] || DEFAULT_TRANSFORM;
  const updateTransform = (idx: number, key: keyof TransformState, value: number) => {
    setTransforms(prev => ({ ...prev, [idx]: { ...(prev[idx]||DEFAULT_TRANSFORM), [key]: value } }));
  };

  const canvasSize = getCanvasDimensions(aspectRatio);

  const getEventXY = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      if (e.touches && e.touches.length > 0) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length > 0) return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    const me = e as MouseEvent | React.MouseEvent;
    return { clientX: me.clientX, clientY: me.clientY };
  };

  const getTouchDistance = (e: React.TouchEvent | TouchEvent) => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleDividerStart = (initEvent: React.MouseEvent | React.TouchEvent, type: 'col' | 'row') => {
    initEvent.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const onMove = (me: MouseEvent | TouchEvent) => {
      const { clientX, clientY } = getEventXY(me);
      const rawPos = type === 'col'
        ? ((clientX - rect.left) / rect.width) * 100
        : ((clientY - rect.top) / rect.height) * 100;
      if (type === 'col') setColPercent(Math.max(15, Math.min(85, rawPos)));
      else setRowPercent(Math.max(15, Math.min(85, rawPos)));
    };
    
    const onUp = () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp);
  };

  const handleWorkspaceWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    let z = canvasZoom + e.deltaY * -0.002;
    if (z <= 1) { z = 1; setCanvasPan({ x:0, y:0 }); }
    if (z > 8) z = 8;
    setCanvasZoom(z);
  };

  const handleWorkspaceStart = (initEvent: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in initEvent;
    
    if (isTouch && initEvent.touches.length === 2 && selectedGridIndex !== null) {
      if (initEvent.cancelable) initEvent.preventDefault();
      const idx = selectedGridIndex;
      const initDist = getTouchDistance(initEvent);
      const initScale = getTransform(idx).scale;

      const onTouchMoveGlobalPinch = (me: TouchEvent) => {
        if (me.touches.length < 2) return;
        const currentDist = getTouchDistance(me);
        if (initDist > 0 && currentDist > 0) {
          const factor = currentDist / initDist;
          updateTransform(idx, 'scale', Math.max(0.1, Math.min(8, initScale * factor)));
        }
      };
      const onTouchEndGlobalPinch = () => {
        window.removeEventListener('touchmove', onTouchMoveGlobalPinch);
        window.removeEventListener('touchend', onTouchEndGlobalPinch);
      };
      window.addEventListener('touchmove', onTouchMoveGlobalPinch, { passive: false });
      window.addEventListener('touchend', onTouchEndGlobalPinch);
      return;
    }

    if (!isSpacePressed && !isTouch && (initEvent as React.MouseEvent).button !== 1) return;
    setIsWorkspacePanning(true);
    const { clientX: sx, clientY: sy } = getEventXY(initEvent);
    const ip = { ...canvasPan };
    
    const mv = (me: MouseEvent | TouchEvent) => {
      const { clientX, clientY } = getEventXY(me);
      setCanvasPan({ x: ip.x + (clientX - sx), y: ip.y + (clientY - sy) });
    };
    const up = () => {
      setIsWorkspacePanning(false);
      window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', mv, { passive: false }); window.addEventListener('touchend', up);
  };

  const handleCellStart = (reactEvent: React.MouseEvent | React.TouchEvent, idx: number) => {
    const isTouch = 'touches' in reactEvent;
    if (!isTouch && (reactEvent as React.MouseEvent).button !== 0) return;
    if (isSpacePressed) return;
    
    if (reactEvent.cancelable) reactEvent.preventDefault();
    reactEvent.stopPropagation();

    const isSelected = selectedGridIndex === idx;

    if (isTouch && reactEvent.touches.length === 2 && isSelected) {
      const initDist = getTouchDistance(reactEvent);
      const initScale = getTransform(idx).scale;
      const onTouchMovePinch = (me: TouchEvent) => {
        if (me.touches.length < 2) return;
        const currentDist = getTouchDistance(me);
        if (initDist > 0 && currentDist > 0) {
          const factor = currentDist / initDist;
          updateTransform(idx, 'scale', Math.max(0.1, Math.min(8, initScale * factor)));
        }
      };
      const onTouchEndPinch = () => {
        window.removeEventListener('touchmove', onTouchMovePinch);
        window.removeEventListener('touchend', onTouchEndPinch);
      };
      window.addEventListener('touchmove', onTouchMovePinch, { passive: false });
      window.addEventListener('touchend', onTouchEndPinch);
      return;
    }

    const { clientX: sx, clientY: sy } = getEventXY(reactEvent);
    const t = getTransform(idx);
    const ioX = t.offsetX, ioY = t.offsetY;
    let hasMoved = false, lastTarget = idx;
    if (!isSelected) setDraggedIndex(idx);

    const layoutSnap = getDynamicLayout(images.length, templateIndex, colPercent, rowPercent);

    const mv = (me: MouseEvent | TouchEvent) => {
      if ('touches' in me && me.touches.length >= 2) return;
      const { clientX, clientY } = getEventXY(me);
      const dx = clientX - sx, dy = clientY - sy;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
      
      if (isSelected) {
        setTransforms(prev => ({
          ...prev,
          [idx]: { ...(prev[idx] || DEFAULT_TRANSFORM), offsetX: ioX + dx / (canvasZoom * mobileScale), offsetY: ioY + dy / (canvasZoom * mobileScale) }
        }));
      } else {
        if (containerRef.current) {
          const r = containerRef.current.getBoundingClientRect();
          const mx = ((clientX - r.left) / r.width) * 100;
          const my = ((clientY - r.top) / r.height) * 100;
          const found = layoutSnap.cells.findIndex(c => mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h);
          lastTarget = found >= 0 ? found : idx;
          setPotentialSwapIndex(lastTarget);
        }
      }
    };

    const up = () => {
      window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', up);
      setPotentialSwapIndex(null); setDraggedIndex(null);
      
      if (!hasMoved) {
        setSelectedGridIndex(idx);
      } else if (!isSelected && lastTarget !== idx) {
        setImages(prev => { const n = [...prev]; [n[idx], n[lastTarget]] = [n[lastTarget], n[idx]]; return n; });
        setTransforms(prev => { const n = { ...prev }; [n[idx], n[lastTarget]] = [n[lastTarget] || DEFAULT_TRANSFORM, n[idx] || DEFAULT_TRANSFORM]; return n; });
        setImageAspects(prev => {
          const n = { ...prev }; const a = n[idx]; const b = n[lastTarget];
          if (a !== undefined) n[lastTarget] = a; else delete n[lastTarget];
          if (b !== undefined) n[idx] = b; else delete n[idx];
          return n;
        });
        setSelectedGridIndex(prev => prev === idx ? lastTarget : prev === lastTarget ? idx : prev);
      }
    };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', mv, { passive: false }); window.addEventListener('touchend', up);
  };

  const handleCellWheel = (e: React.WheelEvent, idx: number) => {
    if (selectedGridIndex !== idx || e.ctrlKey) return;
    const t = getTransform(idx);
    updateTransform(idx, 'scale', Math.max(0.1, Math.min(8, t.scale + e.deltaY * -0.0012)));
  };

  // ─── 💡 🌟 核心重构：方案 B 智能追加导入流（完美通过 iOS 物理覆盖机制激活） ───
  const handleBatchAppendFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    const newUrls = Array.from(files).map(f => URL.createObjectURL(f));
    // 直接在原先的数组屁股后面追加，保留老照片！
    setImages(prev => [...prev, ...newUrls]);
    e.target.value = ''; // 清空选择器器，允许重复追加相同文件
  };

  // ─── 💡 🌟 核心新增：精准单图替换机制 ───────────────────────────────────────
  const handleReplaceSingleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || selectedGridIndex === null) return;
    
    const targetIdx = selectedGridIndex;
    const newUrl = URL.createObjectURL(files[0]);

    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[targetIdx]); // 安全释放老内存
      updated[targetIdx] = newUrl;
      return updated;
    });

    // 抹掉上张图的长宽比，让新图加载时重新触发布局自适应计算
    setImageAspects(prev => { const n = { ...prev }; delete n[targetIdx]; return n; });
    e.target.value = '';
  };

  // ─── 💡 🌟 核心新增：精准单图删除并智能降级矩阵 ───────────────────────────────
  const handleCancelSingleFile = () => {
    if (selectedGridIndex === null) return;
    const targetIdx = selectedGridIndex;

    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[targetIdx]); // 销毁老内存网
      updated.splice(targetIdx, 1);
      return updated;
    });

    // 联动平移和缩放矩阵图层向前整体坍塌挪位
    setTransforms(prev => {
      const nextT: Record<number, TransformState> = {};
      Object.keys(prev).forEach(k => {
        const i = parseInt(k);
        if (i < targetIdx) nextT[i] = prev[i];
        else if (i > targetIdx) nextT[i - 1] = prev[i];
      });
      return nextT;
    });

    // 长宽比映射索引同步位移
    setImageAspects(prev => {
      const nextA: Record<number, number> = {};
      Object.keys(prev).forEach(k => {
        const i = parseInt(k);
        if (i < targetIdx) nextA[i] = prev[i];
        else if (i > targetIdx) nextA[i - 1] = prev[i];
      });
      return nextA;
    });

    setSelectedGridIndex(null); // 清空选择，完成降级排版布局
  };

  const exportFusedImage = async () => {
    if (!images.length) return;
    setIsExporting(true);
    const snapImgs = [...images], snapT = { ...transforms };
    const snapLayout = getDynamicLayout(snapImgs.length, templateIndex, colPercent, rowPercent);
    try {
      const EW = 2048, { aspect } = getCanvasDimensions(aspectRatio), EH = Math.round(EW / aspect);
      const canvas = document.createElement('canvas'); canvas.width = EW; canvas.height = EH;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, EW, EH);
      const sf = EW / canvasSize.width;

      for (let i = 0; i < snapLayout.cells.length; i++) {
        const cell = snapLayout.cells[i], imgUrl = snapImgs[i];
        if (!imgUrl) continue;
        
        const dx = (cell.x / 100) * EW, dy = (cell.y / 100) * EH, dw = (cell.w / 100) * EW, dh = (cell.h / 100) * EH;
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const el = new Image(); el.crossOrigin = 'anonymous'; el.onload = () => res(el); el.onerror = rej; el.src = imgUrl;
        });
        const t = snapT[i] || DEFAULT_TRANSFORM;
        
        ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
        ctx.translate(dx + dw / 2 + t.offsetX * sf, dy + dh / 2 + t.offsetY * sf);
        ctx.rotate((t.rotate * Math.PI) / 180); ctx.scale(t.scale, t.scale);
        
        const rT = dw / dh; const rS = img.naturalWidth / img.naturalHeight;
        let renderW: number, renderH: number;
        if (rS > rT) { renderH = dh; renderW = dh * rS; } else { renderW = dw; renderH = dw / rS; }
        
        ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
        ctx.restore();
      }
      const dl = document.createElement('a'); dl.download = `GridStudio_Fused_${Date.now()}.jpg`;
      dl.href = canvas.toDataURL('image/jpeg', 0.88); dl.click();
    } catch(err) { console.error('导出失败', err); }
    finally { setIsExporting(false); }
  };

  const currentLayout = getDynamicLayout(images.length, templateIndex, colPercent, rowPercent);

  return (
    <div onClick={() => setSelectedGridIndex(null)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      height: '100vh', width: '100vw', backgroundColor: '#090d16', color: '#fff',
      fontFamily: 'system-ui,sans-serif', padding: '16px', boxSizing: 'border-box', overflow: 'hidden',
    }}>

      {/* 控制面板 */}
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '780px', backgroundColor: '#111827', padding: '14px 16px',
        borderRadius: '16px', marginBottom: '12px', border: '1px solid #1e293b', zIndex: 100,
      }}>
        {/* 顶栏 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '12px' }}>
          
          {/* 💡 🌟 核心升级：废弃 display: none，改用绝对定位透明遮罩无缝覆盖机制 */}
          <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
            <button style={{
              padding: '8px 18px', backgroundColor: '#a3e635', color: '#090d16', border: 'none',
              borderRadius: '8px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
            }}>📂 {images.length > 0 ? '➕ 继续追加照片' : '📂 批量导入照片'}</button>
            <input type="file" onChange={handleBatchAppendFiles} accept="image/*" multiple style={{
              position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', fontSize: '100px'
            }} />
          </div>

          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {images.length > 0 ? `已智能载入 ${images.length} 张（追加排版流已就绪）` : '暂未导入图片'}
          </span>
          <button onClick={exportFusedImage} disabled={isExporting || !images.length} style={{
            marginLeft: 'auto', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px',
            fontSize: '12px', fontWeight: 700,
            backgroundColor: !images.length ? '#334155' : '#e11d48',
            cursor: !images.length ? 'not-allowed' : 'pointer',
          }}>{isExporting ? '⏳ 盖印打包中...' : '💾 一键导出合并图'}</button>
        </div>

        {/* 尺寸比例 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', width: '65px', flexShrink: 0, fontWeight: 600 }}>尺寸比例:</span>
          {['3:4', '1:1', '9:16', '2:3', '1:2', '4:3', '3:2', '16:9'].map(r => (
            <button key={r} onClick={() => setAspectRatio(r)} style={{
              padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', flexShrink: 0,
              backgroundColor: aspectRatio === r ? 'rgba(163,230,53,0.2)' : 'transparent',
              color: aspectRatio === r ? '#a3e635' : '#cbd5e1',
              border: aspectRatio === r ? '1px solid #a3e635' : '1px solid #334155',
            }}>{r}</button>
          ))}
        </div>

        {/* 拼接样式 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: selectedGridIndex !== null ? '10px' : '0' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', width: '65px', fontWeight: 600, paddingTop: '6px', flexShrink: 0 }}>拼接样式:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {([
              [0, '矩阵均分', <svg key="s0" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/><rect x="13" y="1" width="10" height="10" rx="1" fill="currentColor"/><rect x="1" y="13" width="10" height="10" rx="1" fill="currentColor"/><rect x="13" y="13" width="10" height="10" rx="1" fill="currentColor"/></svg>],
              [1, '左大右小', <svg key="s1" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="13" height="22" rx="1" fill="currentColor"/><rect x="16" y="1" width="7" height="10" rx="1" fill="currentColor"/><rect x="16" y="13" width="7" height="10" rx="1" fill="currentColor"/></svg>],
              [2, '横向竖条', <svg key="s2" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="6" height="22" rx="1" fill="currentColor"/><rect x="9" y="1" width="6" height="22" rx="1" fill="currentColor"/><rect x="17" y="1" width="6" height="22" rx="1" fill="currentColor"/></svg>],
              [3, '纵向横条', <svg key="s3" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="22" height="6" rx="1" fill="currentColor"/><rect x="1" y="9" width="22" height="6" rx="1" fill="currentColor"/><rect x="1" y="17" width="22" height="6" rx="1" fill="currentColor"/></svg>],
              [4, '上大下小', <svg key="s4" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="22" height="13" rx="1" fill="currentColor"/><rect x="1" y="16" width="10" height="7" rx="1" fill="currentColor"/><rect x="13" y="16" width="10" height="7" rx="1" fill="currentColor"/></svg>],
              [5, '下大上小', <svg key="s5" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="10" height="7" rx="1" fill="currentColor"/><rect x="13" y="1" width="10" height="7" rx="1" fill="currentColor"/><rect x="1" y="10" width="22" height="13" rx="1" fill="currentColor"/></svg>],
              [6, '右大左小', <svg key="s6" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="7" height="10" rx="1" fill="currentColor"/><rect x="1" y="13" width="7" height="10" rx="1" fill="currentColor"/><rect x="10" y="1" width="13" height="22" rx="1" fill="currentColor"/></svg>],
              [7, '三明治',   <svg key="s7" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="5" height="22" rx="1" fill="currentColor"/><rect x="8" y="1" width="8" height="22" rx="1" fill="currentColor"/><rect x="18" y="1" width="5" height="22" rx="1" fill="currentColor"/></svg>],
              [8, '顶横+底分', <svg key="s8" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="22" height="9" rx="1" fill="currentColor"/><rect x="1" y="12" width="10" height="11" rx="1" fill="currentColor"/><rect x="13" y="12" width="10" height="11" rx="1" fill="currentColor"/></svg>],
              [9, '黄金螺旋', <svg key="s9" viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="13" height="13" rx="1" fill="currentColor"/><rect x="16" y="1" width="7" height="8" rx="1" fill="currentColor"/><rect x="16" y="11" width="7" height="12" rx="1" fill="currentColor"/><rect x="1" y="16" width="13" height="7" rx="1" fill="currentColor"/></svg>],
            ] as [number, string, React.ReactNode][]).map(([idx, label, icon]) => {
              const isActive = templateIndex === idx && images.length >= 2;
              return (
                <button key={idx} title={label as string}
                  onClick={() => setTemplateIndex(idx as number)}
                  disabled={images.length < 2}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                    padding: '5px 6px', borderRadius: '7px',
                    border: isActive ? '1.5px solid #a3e635' : '1.5px solid #334155',
                    cursor: images.length < 2 ? 'not-allowed' : 'pointer',
                    opacity: images.length < 2 ? 0.35 : 1,
                    backgroundColor: isActive ? 'rgba(163,230,53,0.12)' : '#1e293b',
                    color: isActive ? '#a3e635' : '#64748b',
                    minWidth: '46px',
                  }}>
                  {icon}
                  <span style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>{label as string}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 顶部微调滑块栏（💡 🌟 已完美整合一键替换与智能降级删除按钮） */}
        {selectedGridIndex !== null && (
          <div style={{
            marginTop: '10px', padding: '10px 12px', backgroundColor: 'rgba(163,230,53,0.06)',
            border: '1px dashed rgba(163,230,53,0.3)', borderRadius: '12px',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#a3e635', fontWeight: 600, whiteSpace: 'nowrap' }}>⚙️ 调节图 {selectedGridIndex + 1}:</span>
              <input type="range" min="-180" max="180" step="0.1"
                value={getTransform(selectedGridIndex).rotate}
                onChange={e => updateTransform(selectedGridIndex, 'rotate', parseFloat(e.target.value))}
                style={{ flexGrow: 1, accentColor: '#a3e635', cursor: 'pointer', height: '5px' }} />
              <span style={{ fontSize: '12px', color: '#cbd5e1', minWidth: '45px', fontFamily: 'monospace', textAlign: 'right' }}>
                {getTransform(selectedGridIndex).rotate.toFixed(1)}°
              </span>
              <button onClick={() => updateTransform(selectedGridIndex, 'rotate', 0)}
                style={{ padding: '3px 8px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>
                角零位
              </button>
            </div>

            {/* 功能快捷键动作栏 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              
              {/* 💡 🌟 精准无损单图替换（同样采用透明定位覆盖，彻底免疫 iOS 拦截） */}
              <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                <button style={{
                  padding: '4px 10px', backgroundColor: '#2563eb', color: '#fff', border: 'none',
                  borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                }}>🔄 替换当前单张</button>
                <input type="file" onChange={handleReplaceSingleFile} accept="image/*" style={{
                  position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer'
                }} />
              </div>

              {/* 💡 🌟 精准单图删除并自动收缩降级布局 */}
              <button onClick={handleCancelSingleFile} style={{
                padding: '4px 10px', backgroundColor: '#dc2626', color: '#fff', border: 'none',
                borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
              }}>🗑️ 精准删除此图</button>

              <button onClick={() => setTransforms(prev => ({ ...prev, [selectedGridIndex]: DEFAULT_TRANSFORM }))}
                style={{ padding: '4px 10px', backgroundColor: '#4b5563', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', marginLeft: 'auto' }}>
                重置此层位置
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── PS 级别工作区 ── */}
      <div ref={workspaceRef} onWheel={handleWorkspaceWheel} onMouseDown={handleWorkspaceStart} onTouchStart={handleWorkspaceStart} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexGrow: 1, width: '100%', minHeight: '320px',
        overflow: 'hidden', backgroundColor: '#070a10', position: 'relative',
        cursor: isSpacePressed ? (isWorkspacePanning ? 'grabbing' : 'grab') : 'default',
      }}>
        {!images.length ? (
          <div style={{
            width: '280px', height: '280px', border: '2px dashed #334155', borderRadius: '16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#475569', position: 'relative', overflow: 'hidden'
          }}>
            <span style={{ fontSize: '32px' }}>📥</span>
            <span style={{ fontSize: '14px', marginTop: '8px' }}>点击批量导入单据/花卉照片</span>
            <input type="file" onChange={handleBatchAppendFiles} accept="image/*" multiple style={{
              position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer'
            }} />
          </div>
        ) : (
          <div style={{
            transform: `scale(${mobileScale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div ref={containerRef} style={{
              position: 'relative',
              width: `${canvasSize.width}px`, height: `${canvasSize.height}px`,
              backgroundColor: '#090d16', border: '2px solid #334155', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
              transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
              transformOrigin: 'center center',
              transition: isWorkspacePanning ? 'none' : 'width 0.2s, height 0.2s, transform 0.1s ease-out',
            }}>

              {/* 剪贴遮罩格子层 */}
              {currentLayout.cells.map((cell, index) => {
                const transform = getTransform(index);
                const isSelected = selectedGridIndex === index;
                const isBeingDragged = draggedIndex === index;
                const isPotentialTarget = potentialSwapIndex === index && draggedIndex !== index;

                const cellWidthPx = (cell.w / 100) * canvasSize.width;
                const cellHeightPx = (cell.h / 100) * canvasSize.height;
                const cellAspect = cellWidthPx / cellHeightPx;
                const imgAspect = imageAspects[index];

                let dynamicImgStyle: React.CSSProperties = {
                  flexShrink: 0,
                  pointerEvents: 'none',
                  transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
                  transformOrigin: 'center center',
                };

                if (imgAspect) {
                  if (imgAspect > cellAspect) {
                    dynamicImgStyle.height = '100%'; dynamicImgStyle.width = 'auto';
                  } else {
                    dynamicImgStyle.width = '100%'; dynamicImgStyle.height = 'auto';
                  }
                } else {
                  dynamicImgStyle.width = '100%'; dynamicImgStyle.height = '100%';
                }

                return (
                  <div key={index}
                    onWheel={e => handleCellWheel(e, index)}
                    onMouseDown={e => handleCellStart(e, index)}
                    onTouchStart={e => handleCellStart(e, index)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      left: `${cell.x}%`, top: `${cell.y}%`, width: `${cell.w}%`, height: `${cell.h}%`,
                      boxSizing: 'border-box', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: isSelected ? '2px solid #a3e635' : isPotentialTarget ? '2px dashed #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                      zIndex: isSelected || isBeingDragged ? 20 : 1,
                      opacity: isBeingDragged ? 0.35 : 1,
                      cursor: isSpacePressed ? 'inherit' : (isSelected ? 'move' : 'grab'),
                      touchAction: 'none'
                    }}>
                    <div style={{
                      width: '100%', height: '100%', backgroundColor: '#111827',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={images[index]} alt={`图片 ${index + 1}`} 
                        onLoad={(e) => {
                          const aspect = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
                          setImageAspects(prev => ({ ...prev, [index]: aspect }));
                        }}
                        style={dynamicImgStyle}
                      />
                    </div>
                  </div>
                );
              })}

              {/* 联动控制线条 */}
              {currentLayout.dividers.map((d, idx) => {
                const isCol = d.type === 'col';
                return (
                  <div key={idx}
                    onMouseDown={e => handleDividerStart(e, d.type)}
                    onTouchStart={e => handleDividerStart(e, d.type)}
                    style={{
                      position: 'absolute',
                      left: isCol ? `calc(${d.pos}% - 6px)` : `${d.span[0]}%`,
                      top: isCol ? `${d.span[0]}%` : `calc(${d.pos}% - 6px)`,
                      width: isCol ? '12px' : `${d.span[1] - d.span[0]}%`,
                      height: isCol ? `${d.span[1] - d.span[0]}%` : '12px',
                      cursor: isCol ? 'ew-resize' : 'ns-resize',
                      zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <div style={{
                      width: isCol ? '2px' : '100%',
                      height: isCol ? '100%' : '2px',
                      backgroundColor: 'rgba(163,230,53,0.5)',
                    }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      {images.length > 0 && (
        <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px', display: 'flex', gap: '20px' }}>
          <div>🔍 {canvasZoom.toFixed(1)}x {canvasZoom > 1 ? '(Ctrl+滚轮可继续放缩)' : '(原始画布)'}</div>
          <div>✋ Space + 鼠标左键：平移整块工作区 · 单击任何格子进入微调</div>
        </div>
      )}
    </div>
  );
}
