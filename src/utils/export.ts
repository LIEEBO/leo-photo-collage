import type { TransformState, CellLayout, CanvasDimensions } from '../types';
import { DEFAULT_TRANSFORM } from '../types';

export async function exportFusedImage(
  images: string[],
  transforms: Record<number, TransformState>,
  layout: { cells: CellLayout[] },
  aspectRatio: string,
  canvasSize: CanvasDimensions,
): Promise<void> {
  if (!images.length) return;

  const EW = 2048;
  const { aspect } = canvasSize;
  const EH = Math.round(EW / aspect);

  const canvas = document.createElement('canvas');
  canvas.width = EW;
  canvas.height = EH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, EW, EH);

  const sf = EW / canvasSize.width;

  let errorCount = 0;

  for (let i = 0; i < layout.cells.length; i++) {
    const cell = layout.cells[i];
    const imgUrl = images[i];
    if (!imgUrl) continue;

    const dx = (cell.x / 100) * EW;
    const dy = (cell.y / 100) * EH;
    const dw = (cell.w / 100) * EW;
    const dh = (cell.h / 100) * EH;

    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => res(el);
        el.onerror = () => rej(new Error(`图片 ${i + 1} 加载失败`));
        el.src = imgUrl;
      });

      const t = transforms[i] || DEFAULT_TRANSFORM;

      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, dw, dh);
      ctx.clip();
      ctx.translate(
        dx + dw / 2 + t.offsetX * sf,
        dy + dh / 2 + t.offsetY * sf,
      );
      ctx.rotate((t.rotate * Math.PI) / 180);
      ctx.scale(t.scale, t.scale);

      const rT = dw / dh;
      const rS = img.naturalWidth / img.naturalHeight;
      let renderW: number;
      let renderH: number;

      if (rS > rT) {
        renderH = dh;
        renderW = dh * rS;
      } else {
        renderW = dw;
        renderH = dw / rS;
      }

      ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
      ctx.restore();
    } catch {
      errorCount++;
    }
  }

  const dl = document.createElement('a');
  dl.download = `Leo_Collage_${aspectRatio.replace(':', 'x')}_${Date.now()}.jpg`;
  dl.href = canvas.toDataURL('image/jpeg', 0.88);
  dl.click();

  if (errorCount > 0) {
    console.warn(`导出时 ${errorCount} 张图片加载失败，已跳过`);
  }
}
