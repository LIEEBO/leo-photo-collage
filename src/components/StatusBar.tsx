import React from 'react';

interface StatusBarProps {
  isTouchDevice: boolean;
  canvasZoom: number;
  imagesCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ isTouchDevice, canvasZoom, imagesCount }) => {
  if (imagesCount === 0) return null;

  return (
    <div className="status-bar">
      <span className="status-zoom">
        🔍 {canvasZoom.toFixed(1)}x
        {canvasZoom > 1 ? ' (Ctrl+滚轮缩放)' : ' (原始画布)'}
      </span>
      <span className="status-hint">
        {isTouchDevice
          ? '✋ 双指缩放 · 单指拖动图层 · 长按拖拽交换位置'
          : '✋ Space+拖拽平移画布 · 滚轮缩放图层 · 拖拽交换位置'}
      </span>
    </div>
  );
};

export default StatusBar;
