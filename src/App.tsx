import React from 'react';
import { useAppState } from './hooks/useAppState';
import ControlPanel from './components/ControlPanel';
import Workspace from './components/Workspace';
import StatusBar from './components/StatusBar';
import './App.css';

export default function App() {
  const state = useAppState();

  return (
    <div
      className="app-shell"
      onClick={() => state.setSelectedGridIndex(null)}
    >
      <ControlPanel
        aspectRatio={state.aspectRatio}
        setAspectRatio={state.setAspectRatio}
        templateIndex={state.templateIndex}
        setTemplateIndex={state.setTemplateIndex}
        isExporting={state.isExporting}
        imagesCount={state.images.length}
        selectedGridIndex={state.selectedGridIndex}
        isTouchDevice={state.isTouchDevice}
        colPercent={state.colPercent}
        rowPercent={state.rowPercent}
        getTransform={state.getTransform}
        updateTransform={state.updateTransform}
        resetTransform={state.resetTransform}
        fileInputRef={state.fileInputRef}
        triggerBatchUpload={state.triggerBatchUpload}
        handleFileChange={state.handleFileChange}
        exportImage={state.exportImage}
      />

      <Workspace
        images={state.images}
        imagesCount={state.images.length}
        selectedGridIndex={state.selectedGridIndex}
        draggedIndex={state.draggedIndex}
        potentialSwapIndex={state.potentialSwapIndex}
        transforms={state.transforms}
        imageAspects={state.imageAspects}
        canvasSize={state.canvasSize}
        canvasZoom={state.canvasZoom}
        canvasPan={state.canvasPan}
        isSpacePressed={state.isSpacePressed}
        isWorkspacePanning={state.isWorkspacePanning}
        mobileScale={state.mobileScale}
        currentLayout={state.currentLayout}
        containerRef={state.containerRef}
        workspaceRef={state.workspaceRef}
        isTouchDevice={state.isTouchDevice}
        handleWorkspaceWheel={state.handleWorkspaceWheel}
        handleWorkspaceStart={state.handleWorkspaceStart}
        handleCellStart={state.handleCellStart}
        handleDividerStart={state.handleDividerStart}
        handleCellWheel={state.handleCellWheel}
        triggerBatchUpload={state.triggerBatchUpload}
        handleDrop={state.handleDrop}
        setImageAspects={state.setImageAspects}
      />

      <StatusBar
        isTouchDevice={state.isTouchDevice}
        canvasZoom={state.canvasZoom}
        imagesCount={state.images.length}
      />
    </div>
  );
}
