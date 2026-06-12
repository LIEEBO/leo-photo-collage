import React, { type RefObject } from 'react';
import type { AspectRatio, TransformState } from '../types';
import { ASPECT_RATIOS } from '../types';

// ─── 模板 SVG 图标 ──────────────────────────────────────────────────────────
const TEMPLATE_ICONS: Record<number, React.ReactNode> = {
  0: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/><rect x="13" y="1" width="10" height="10" rx="1" fill="currentColor"/><rect x="1" y="13" width="10" height="10" rx="1" fill="currentColor"/><rect x="13" y="13" width="10" height="10" rx="1" fill="currentColor"/></svg>,
  1: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="13" height="22" rx="1" fill="currentColor"/><rect x="16" y="1" width="7" height="10" rx="1" fill="currentColor"/><rect x="16" y="13" width="7" height="10" rx="1" fill="currentColor"/></svg>,
  2: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="6" height="22" rx="1" fill="currentColor"/><rect x="9" y="1" width="6" height="22" rx="1" fill="currentColor"/><rect x="17" y="1" width="6" height="22" rx="1" fill="currentColor"/></svg>,
  3: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="22" height="6" rx="1" fill="currentColor"/><rect x="1" y="9" width="22" height="6" rx="1" fill="currentColor"/><rect x="1" y="17" width="22" height="6" rx="1" fill="currentColor"/></svg>,
  4: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="22" height="13" rx="1" fill="currentColor"/><rect x="1" y="16" width="10" height="7" rx="1" fill="currentColor"/><rect x="13" y="16" width="10" height="7" rx="1" fill="currentColor"/></svg>,
  5: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="10" height="7" rx="1" fill="currentColor"/><rect x="13" y="1" width="10" height="7" rx="1" fill="currentColor"/><rect x="1" y="10" width="22" height="13" rx="1" fill="currentColor"/></svg>,
  6: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="7" height="10" rx="1" fill="currentColor"/><rect x="1" y="13" width="7" height="10" rx="1" fill="currentColor"/><rect x="10" y="1" width="13" height="22" rx="1" fill="currentColor"/></svg>,
  7: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="5" height="22" rx="1" fill="currentColor"/><rect x="8" y="1" width="8" height="22" rx="1" fill="currentColor"/><rect x="18" y="1" width="5" height="22" rx="1" fill="currentColor"/></svg>,
  8: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="22" height="9" rx="1" fill="currentColor"/><rect x="1" y="12" width="10" height="11" rx="1" fill="currentColor"/><rect x="13" y="12" width="10" height="11" rx="1" fill="currentColor"/></svg>,
  9: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="1" width="13" height="13" rx="1" fill="currentColor"/><rect x="16" y="1" width="7" height="8" rx="1" fill="currentColor"/><rect x="16" y="11" width="7" height="12" rx="1" fill="currentColor"/><rect x="1" y="16" width="13" height="7" rx="1" fill="currentColor"/></svg>,
};

interface ControlPanelProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (v: AspectRatio) => void;
  templateIndex: number;
  setTemplateIndex: (v: number) => void;
  isExporting: boolean;
  imagesCount: number;
  selectedGridIndex: number | null;
  isTouchDevice: boolean;
  colPercent: number;
  rowPercent: number;
  getTransform: (idx: number) => TransformState;
  updateTransform: (idx: number, key: keyof TransformState, value: number) => void;
  resetTransform: (idx: number) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  triggerBatchUpload: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportImage: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  aspectRatio, setAspectRatio,
  templateIndex, setTemplateIndex,
  isExporting, imagesCount, selectedGridIndex,
  isTouchDevice, colPercent, rowPercent,
  getTransform, updateTransform, resetTransform,
  fileInputRef, triggerBatchUpload, handleFileChange, exportImage,
}) => {
  const hasImages = imagesCount > 0;

  return (
    <div className="control-panel" onClick={e => e.stopPropagation()}>
      {/* ── 顶栏：导入/导出 ── */}
      <div className="control-topbar">
        <button onClick={triggerBatchUpload} className="btn btn-import">
          📂 批量导入照片
        </button>
        <span className="image-count">
          {hasImages
            ? `已载入 ${imagesCount} 张`
            : '暂未导入图片'}
        </span>
        <button
          onClick={exportImage}
          disabled={isExporting || !hasImages}
          className="btn btn-export"
        >
          {isExporting ? '⏳ 导出中...' : '💾 一键导出'}
        </button>
      </div>

      {/* ── 尺寸比例 ── */}
      <div className="control-row aspect-row">
        <span className="control-label">尺寸比例</span>
        <div className="aspect-buttons">
          {ASPECT_RATIOS.map(r => (
            <button
              key={r}
              onClick={() => setAspectRatio(r)}
              className={`btn btn-aspect ${aspectRatio === r ? 'active' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── 拼接样式 ── */}
      <div className="control-row template-row">
        <span className="control-label">拼接样式</span>
        <div className="template-buttons">
          {([0,1,2,3,4,5,6,7,8,9] as const).map(id => {
            const isActive = templateIndex === id && imagesCount >= 2;
            const labels = ['矩阵均分','左大右小','横向竖条','纵向横条','上大下小','下大上小','右大左小','三明治','顶横+底分','黄金螺旋'];
            return (
              <button
                key={id}
                title={labels[id]}
                onClick={() => setTemplateIndex(id)}
                disabled={imagesCount < 2}
                className={`btn btn-template ${isActive ? 'active' : ''}`}
              >
                {TEMPLATE_ICONS[id]}
                <span className="template-label">{labels[id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 选中图片调节滑块 ── */}
      {selectedGridIndex !== null && (
        <div className="adjust-panel">
          <span className="adjust-title">⚙️ 调节图 {selectedGridIndex + 1}</span>
          <div className="adjust-controls">
            <input
              type="range"
              min="-180" max="180" step="0.1"
              value={getTransform(selectedGridIndex).rotate}
              onChange={e => updateTransform(selectedGridIndex, 'rotate', parseFloat(e.target.value))}
              className="adjust-slider"
            />
            <span className="adjust-value">
              {getTransform(selectedGridIndex).rotate.toFixed(1)}°
            </span>
          </div>
          <div className="adjust-actions">
            <button
              onClick={() => updateTransform(selectedGridIndex, 'rotate', 0)}
              className="btn btn-sm btn-reset-angle"
            >
              角零位
            </button>
            <button
              onClick={() => resetTransform(selectedGridIndex)}
              className="btn btn-sm btn-reset-layer"
            >
              重置图层
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ControlPanel;
