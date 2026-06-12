import React, { type RefObject } from 'react';
import type { TransformState, CellLayout, DividerLayout, CanvasDimensions } from '../types';

interface WorkspaceProps {
  images: string[];
  imagesCount: number;
  selectedGridIndex: number | null;
  draggedIndex: number | null;
  potentialSwapIndex: number | null;
  transforms: Record<number, TransformState>;
  imageAspects: Record<number, number>;
  canvasSize: CanvasDimensions;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  isSpacePressed: boolean;
  isWorkspacePanning: boolean;
  mobileScale: number;
  currentLayout: { cells: CellLayout[]; dividers: DividerLayout[] };
  containerRef: RefObject<HTMLDivElement | null>;
  workspaceRef: RefObject<HTMLDivElement | null>;
  isTouchDevice: boolean;
  handleWorkspaceWheel: (e: React.WheelEvent) => void;
  handleWorkspaceStart: (e: React.MouseEvent | React.TouchEvent) => void;
  handleCellStart: (e: React.MouseEvent | React.TouchEvent, idx: number) => void;
  handleDividerStart: (e: React.MouseEvent | React.TouchEvent, type: 'col' | 'row') => void;
  handleCellWheel: (e: React.WheelEvent, idx: number) => void;
  triggerBatchUpload: () => void;
  handleDrop: (e: React.DragEvent) => void;
  setImageAspects: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}

const Workspace: React.FC<WorkspaceProps> = ({
  images, imagesCount, selectedGridIndex, draggedIndex, potentialSwapIndex,
  transforms, imageAspects, canvasSize, canvasZoom, canvasPan,
  isSpacePressed, isWorkspacePanning, mobileScale, currentLayout,
  containerRef, workspaceRef, isTouchDevice,
  handleWorkspaceWheel, handleWorkspaceStart, handleCellStart,
  handleDividerStart, handleCellWheel, triggerBatchUpload, handleDrop,
  setImageAspects,
}) => {
  const noImages = imagesCount === 0;
  const panCursor = isSpacePressed
    ? (isWorkspacePanning ? 'grabbing' : 'grab')
    : 'default';

  return (
    <div
      ref={workspaceRef}
      className={`workspace ${noImages ? 'workspace-empty' : ''}`}
      onWheel={handleWorkspaceWheel}
      onMouseDown={handleWorkspaceStart}
      onTouchStart={handleWorkspaceStart}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      style={{ cursor: panCursor }}
    >
      {noImages ? (
        <div className="drop-zone" onClick={e => { e.stopPropagation(); triggerBatchUpload(); }}>
          <span className="drop-zone-icon">📥</span>
          <span className="drop-zone-text">点击或拖入图片</span>
          <span className="drop-zone-hint">支持批量选择 · JPG/PNG/WebP</span>
        </div>
      ) : (
        <div
          className="canvas-scaler"
          style={{ transform: `scale(${mobileScale})` }}
        >
          <div
            ref={containerRef}
            className="canvas-container"
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
              transition: isWorkspacePanning ? 'none' : 'width 0.2s, height 0.2s, transform 0.1s ease-out',
            }}
          >
            {/* 剪贴遮罩格子层 */}
            {currentLayout.cells.map((cell, index) => {
              const transform = transforms[index] || { scale: 1, rotate: 0, offsetX: 0, offsetY: 0 };
              const isSelected = selectedGridIndex === index;
              const isBeingDragged = draggedIndex === index;
              const isPotentialTarget = potentialSwapIndex === index && draggedIndex !== index;

              const cellWidthPx = (cell.w / 100) * canvasSize.width;
              const cellHeightPx = (cell.h / 100) * canvasSize.height;
              const cellAspect = cellWidthPx / cellHeightPx;
              const imgAspect = imageAspects[index];

              let imgStyle: React.CSSProperties = {
                flexShrink: 0,
                pointerEvents: 'none',
                transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
                transformOrigin: 'center center',
              };

              if (imgAspect) {
                if (imgAspect > cellAspect) {
                  imgStyle.height = '100%';
                  imgStyle.width = 'auto';
                } else {
                  imgStyle.width = '100%';
                  imgStyle.height = 'auto';
                }
              } else {
                imgStyle.width = '100%';
                imgStyle.height = '100%';
              }

              const cellCursor = isSpacePressed
                ? 'inherit'
                : (isSelected ? 'move' : 'grab');

              return (
                <div
                  key={index}
                  className={`cell ${isSelected ? 'cell-selected' : ''} ${isPotentialTarget ? 'cell-swap-target' : ''} ${isBeingDragged ? 'cell-dragging' : ''}`}
                  onWheel={e => handleCellWheel(e, index)}
                  onMouseDown={e => handleCellStart(e, index)}
                  onTouchStart={e => handleCellStart(e, index)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    left: `${cell.x}%`,
                    top: `${cell.y}%`,
                    width: `${cell.w}%`,
                    height: `${cell.h}%`,
                    zIndex: isSelected || isBeingDragged ? 20 : 1,
                    opacity: isBeingDragged ? 0.35 : 1,
                    cursor: cellCursor,
                    touchAction: 'none',
                  }}
                >
                  <div className="cell-backdrop">
                    <img
                      src={images[index]}
                      alt={`图片 ${index + 1}`}
                      onLoad={(e) => {
                        const aspect = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
                        setImageAspects(prev => ({ ...prev, [index]: aspect }));
                      }}
                      style={imgStyle}
                      draggable={false}
                    />
                  </div>
                </div>
              );
            })}

            {/* 联动控制线条 */}
            {currentLayout.dividers.map((d, idx) => {
              const isCol = d.type === 'col';
              return (
                <div
                  key={idx}
                  className={`divider ${isCol ? 'divider-col' : 'divider-row'}`}
                  onMouseDown={e => handleDividerStart(e, d.type)}
                  onTouchStart={e => handleDividerStart(e, d.type)}
                  style={{
                    position: 'absolute',
                    left: isCol ? `calc(${d.pos}% - 6px)` : `${d.span[0]}%`,
                    top: isCol ? `${d.span[0]}%` : `calc(${d.pos}% - 6px)`,
                    width: isCol ? '12px' : `${d.span[1] - d.span[0]}%`,
                    height: isCol ? `${d.span[1] - d.span[0]}%` : '12px',
                    cursor: isCol ? 'ew-resize' : 'ns-resize',
                    zIndex: 30,
                  }}
                >
                  <div className="divider-line" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
