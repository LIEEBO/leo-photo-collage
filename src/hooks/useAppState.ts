import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  TransformState,
  CellLayout,
  DividerLayout,
  AspectRatio,
  CanvasDimensions,
} from '../types';
import { DEFAULT_TRANSFORM } from '../types';
import { getCanvasDimensions, getDynamicLayout } from '../utils/layout';
import { exportFusedImage } from '../utils/export';

// ─── 触摸/鼠标工具 ──────────────────────────────────────────────────────────
export function getEventXY(
  e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
) {
  if ('touches' in e) {
    if (e.touches && e.touches.length > 0)
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length > 0)
      return {
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY,
      };
  }
  const me = e as MouseEvent | React.MouseEvent;
  return { clientX: me.clientX, clientY: me.clientY };
}

export function getTouchDistance(e: React.TouchEvent | TouchEvent) {
  if (e.touches.length < 2) return 0;
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── 是否触屏设备 ──────────────────────────────────────────────────────────
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

// ─── 主 Hook ───────────────────────────────────────────────────────────────
export function useAppState() {
  // 核心状态
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
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
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // ─── Effects ──────────────────────────────────────────────────────────────
  // 清理 object URL
  useEffect(() => {
    return () => {
      images.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 移动端缩放计算
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);

      if (!workspaceRef.current) return;
      const wWidth = workspaceRef.current.clientWidth - 32;
      const wHeight = workspaceRef.current.clientHeight - 32;
      const currentCanvas = getCanvasDimensions(aspectRatio);

      let factor = 1;
      if (
        currentCanvas.width > wWidth ||
        currentCanvas.height > wHeight
      ) {
        factor = Math.min(
          wWidth / currentCanvas.width,
          wHeight / currentCanvas.height,
        );
      }
      setMobileScale(factor);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [aspectRatio, images.length]);

  // 空格键检测
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ─── 助手 ────────────────────────────────────────────────────────────────
  const getTransform = useCallback(
    (idx: number) => transforms[idx] || DEFAULT_TRANSFORM,
    [transforms],
  );

  const updateTransform = useCallback(
    (idx: number, key: keyof TransformState, value: number) => {
      setTransforms((prev) => ({
        ...prev,
        [idx]: { ...(prev[idx] || DEFAULT_TRANSFORM), [key]: value },
      }));
    },
    [],
  );

  const canvasSize = getCanvasDimensions(aspectRatio);
  const currentLayout = getDynamicLayout(
    images.length,
    templateIndex,
    colPercent,
    rowPercent,
  );

  // ─── 分割线拖拽 ──────────────────────────────────────────────────────────
  const handleDividerStart = useCallback(
    (
      initEvent: React.MouseEvent | React.TouchEvent,
      type: 'col' | 'row',
    ) => {
      initEvent.stopPropagation();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      const onMove = (me: MouseEvent | TouchEvent) => {
        const { clientX, clientY } = getEventXY(me);
        const rawPos =
          type === 'col'
            ? ((clientX - rect.left) / rect.width) * 100
            : ((clientY - rect.top) / rect.height) * 100;
        if (type === 'col') setColPercent(Math.max(15, Math.min(85, rawPos)));
        else setRowPercent(Math.max(15, Math.min(85, rawPos)));
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    },
    [],
  );

  // ─── 工作区滚轮缩放 ──────────────────────────────────────────────────────
  const handleWorkspaceWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      let z = canvasZoom + e.deltaY * -0.002;
      if (z <= 1) {
        z = 1;
        setCanvasPan({ x: 0, y: 0 });
      }
      if (z > 8) z = 8;
      setCanvasZoom(z);
    },
    [canvasZoom],
  );

  // ─── 工作区手势（平移 / 背景双指缩放） ────────────────────────────────────
  const handleWorkspaceStart = useCallback(
    (initEvent: React.MouseEvent | React.TouchEvent) => {
      const isTouch = 'touches' in initEvent;

      // 背景双指缩放选中的图层
      if (
        isTouch &&
        initEvent.touches.length === 2 &&
        selectedGridIndex !== null
      ) {
        if (initEvent.cancelable) initEvent.preventDefault();
        const idx = selectedGridIndex;
        const initDist = getTouchDistance(initEvent);
        const initScale = getTransform(idx).scale;

        const onPinchMove = (me: TouchEvent) => {
          if (me.touches.length < 2) return;
          const currentDist = getTouchDistance(me);
          if (initDist > 0 && currentDist > 0) {
            const factor = currentDist / initDist;
            updateTransform(
              idx,
              'scale',
              Math.max(0.1, Math.min(8, initScale * factor)),
            );
          }
        };
        const onPinchEnd = () => {
          window.removeEventListener('touchmove', onPinchMove);
          window.removeEventListener('touchend', onPinchEnd);
        };
        window.addEventListener('touchmove', onPinchMove, { passive: false });
        window.addEventListener('touchend', onPinchEnd);
        return;
      }

      // 平移工作区（Space+鼠标 / 单指触摸 / 中键）
      if (
        !isSpacePressed &&
        !isTouch &&
        (initEvent as React.MouseEvent).button !== 1
      )
        return;

      setIsWorkspacePanning(true);
      const { clientX: sx, clientY: sy } = getEventXY(initEvent);
      const ip = { ...canvasPan };

      const mv = (me: MouseEvent | TouchEvent) => {
        const { clientX, clientY } = getEventXY(me);
        setCanvasPan({
          x: ip.x + (clientX - sx),
          y: ip.y + (clientY - sy),
        });
      };
      const up = () => {
        setIsWorkspacePanning(false);
        window.removeEventListener('mousemove', mv);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchmove', mv);
        window.removeEventListener('touchend', up);
      };
      window.addEventListener('mousemove', mv);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', mv, { passive: false });
      window.addEventListener('touchend', up);
    },
    [isSpacePressed, canvasPan, selectedGridIndex, getTransform, updateTransform],
  );

  // ─── 格子拖拽 / 交换 / 格子内双指缩放 ──────────────────────────────────────
  const handleCellStart = useCallback(
    (
      reactEvent: React.MouseEvent | React.TouchEvent,
      idx: number,
    ) => {
      const isTouch = 'touches' in reactEvent;
      if (!isTouch && (reactEvent as React.MouseEvent).button !== 0) return;
      if (isSpacePressed) return;

      if (reactEvent.cancelable) reactEvent.preventDefault();
      reactEvent.stopPropagation();

      const isSelected = selectedGridIndex === idx;

      // 格子上双指缩放
      if (isTouch && reactEvent.touches.length === 2 && isSelected) {
        const initDist = getTouchDistance(reactEvent);
        const initScale = getTransform(idx).scale;

        const onPinchMove = (me: TouchEvent) => {
          if (me.touches.length < 2) return;
          const currentDist = getTouchDistance(me);
          if (initDist > 0 && currentDist > 0) {
            const factor = currentDist / initDist;
            updateTransform(
              idx,
              'scale',
              Math.max(0.1, Math.min(8, initScale * factor)),
            );
          }
        };
        const onPinchEnd = () => {
          window.removeEventListener('touchmove', onPinchMove);
          window.removeEventListener('touchend', onPinchEnd);
        };
        window.addEventListener('touchmove', onPinchMove, { passive: false });
        window.addEventListener('touchend', onPinchEnd);
        return;
      }

      // 单指拖拽 / 交换
      const { clientX: sx, clientY: sy } = getEventXY(reactEvent);
      const t = getTransform(idx);
      const ioX = t.offsetX;
      const ioY = t.offsetY;
      let hasMoved = false;
      let lastTarget = idx;
      if (!isSelected) setDraggedIndex(idx);

      const layoutSnap = getDynamicLayout(
        images.length,
        templateIndex,
        colPercent,
        rowPercent,
      );

      const mv = (me: MouseEvent | TouchEvent) => {
        if ('touches' in me && me.touches.length >= 2) return;
        const { clientX, clientY } = getEventXY(me);
        const dx = clientX - sx;
        const dy = clientY - sy;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;

        if (isSelected) {
          setTransforms((prev) => ({
            ...prev,
            [idx]: {
              ...(prev[idx] || DEFAULT_TRANSFORM),
              offsetX:
                ioX + dx / (canvasZoom * mobileScale),
              offsetY:
                ioY + dy / (canvasZoom * mobileScale),
            },
          }));
        } else {
          if (containerRef.current) {
            const r = containerRef.current.getBoundingClientRect();
            const mx = ((clientX - r.left) / r.width) * 100;
            const my = ((clientY - r.top) / r.height) * 100;
            const found = layoutSnap.cells.findIndex(
              (c) =>
                mx >= c.x &&
                mx <= c.x + c.w &&
                my >= c.y &&
                my <= c.y + c.h,
            );
            lastTarget = found >= 0 ? found : idx;
            setPotentialSwapIndex(lastTarget);
          }
        }
      };

      const up = () => {
        window.removeEventListener('mousemove', mv);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchmove', mv);
        window.removeEventListener('touchend', up);
        setPotentialSwapIndex(null);
        setDraggedIndex(null);

        if (!hasMoved) {
          setSelectedGridIndex(idx);
        } else if (!isSelected && lastTarget !== idx) {
          // 交换图片和变换
          setImages((prev) => {
            const n = [...prev];
            [n[idx], n[lastTarget]] = [n[lastTarget], n[idx]];
            return n;
          });
          setTransforms((prev) => {
            const n = { ...prev };
            [n[idx], n[lastTarget]] = [
              n[lastTarget] || DEFAULT_TRANSFORM,
              n[idx] || DEFAULT_TRANSFORM,
            ];
            return n;
          });
          setImageAspects((prev) => {
            const n = { ...prev };
            const a = n[idx];
            const b = n[lastTarget];
            if (a !== undefined) n[lastTarget] = a;
            else delete n[lastTarget];
            if (b !== undefined) n[idx] = b;
            else delete n[idx];
            return n;
          });
          setSelectedGridIndex((prev) =>
            prev === idx
              ? lastTarget
              : prev === lastTarget
                ? idx
                : prev,
          );
        }
      };
      window.addEventListener('mousemove', mv);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', mv, { passive: false });
      window.addEventListener('touchend', up);
    },
    [
      isSpacePressed,
      selectedGridIndex,
      canvasZoom,
      mobileScale,
      images.length,
      templateIndex,
      colPercent,
      rowPercent,
      getTransform,
      updateTransform,
    ],
  );

  // ─── 格子滚轮缩放 ────────────────────────────────────────────────────────
  const handleCellWheel = useCallback(
    (e: React.WheelEvent, idx: number) => {
      if (selectedGridIndex !== idx || e.ctrlKey) return;
      const t = getTransform(idx);
      updateTransform(
        idx,
        'scale',
        Math.max(0.1, Math.min(8, t.scale + e.deltaY * -0.0012)),
      );
    },
    [selectedGridIndex, getTransform, updateTransform],
  );

  // ─── 图片导入 ────────────────────────────────────────────────────────────
  const triggerBatchUpload = useCallback(
    () => fileInputRef.current?.click(),
    [],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
      setImages((prev) => {
        prev.forEach((u) => URL.revokeObjectURL(u));
        return newUrls;
      });
      setTransforms({});
      setImageAspects({});
      setSelectedGridIndex(null);
      setCanvasZoom(1);
      setCanvasPan({ x: 0, y: 0 });
      setTemplateIndex(0);
      e.target.value = '';
    },
    [],
  );

  // ─── 桌面拖拽导入 ────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (!files?.length) return;
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (!imageFiles.length) return;
      const newUrls = imageFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => {
        prev.forEach((u) => URL.revokeObjectURL(u));
        return newUrls;
      });
      setTransforms({});
      setImageAspects({});
      setSelectedGridIndex(null);
      setCanvasZoom(1);
      setCanvasPan({ x: 0, y: 0 });
      setTemplateIndex(0);
    },
    [],
  );

  // ─── 导出 ────────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!images.length) return;
    setIsExporting(true);
    try {
      await exportFusedImage(
        [...images],
        { ...transforms },
        currentLayout,
        aspectRatio,
        canvasSize,
      );
    } finally {
      setIsExporting(false);
    }
  }, [images, transforms, currentLayout, aspectRatio, canvasSize]);

  // ─── 重置单个图层 ────────────────────────────────────────────────────────
  const resetTransform = useCallback((idx: number) => {
    setTransforms((prev) => ({
      ...prev,
      [idx]: DEFAULT_TRANSFORM,
    }));
  }, []);

  return {
    // 状态
    aspectRatio,
    setAspectRatio,
    templateIndex,
    setTemplateIndex,
    isExporting,
    images,
    selectedGridIndex,
    setSelectedGridIndex,
    transforms,
    colPercent,
    rowPercent,
    draggedIndex,
    potentialSwapIndex,
    imageAspects,
    canvasZoom,
    canvasPan,
    isSpacePressed,
    isWorkspacePanning,
    mobileScale,
    isTouchDevice: isMobile,
    setImageAspects,
    // Refs
    containerRef,
    fileInputRef,
    workspaceRef,
    // 计算值
    canvasSize,
    currentLayout,
    getTransform,
    updateTransform,
    // 处理器
    handleDividerStart,
    handleWorkspaceWheel,
    handleWorkspaceStart,
    handleCellStart,
    handleCellWheel,
    triggerBatchUpload,
    handleFileChange,
    handleDrop,
    exportImage: handleExport,
    resetTransform,
  };
}
