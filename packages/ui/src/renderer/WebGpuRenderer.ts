import {
  CellFlags,
  CursorState,
  HoveredLink,
  ITerminalOptions,
  SearchMatch,
  SelectionRange,
  TerminalCell,
  TerminalColor,
  TerminalDiff,
  TerminalImage,
  TerminalTheme,
} from '../types.js';
import { GlyphAtlas } from './GlyphAtlas.js';
import { CanvasRenderer } from './CanvasRenderer.js';

const TERMINAL_WGSL = `
struct Uniforms {
  screenSize: vec2<f32>,
  cellSize: vec2<f32>,
};

struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) cellPos: vec2<f32>,
  @location(3) glyphUV0: vec2<f32>,
  @location(4) glyphUV1: vec2<f32>,
  @location(5) fgColor: vec4<f32>,
  @location(6) bgColor: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) fgColor: vec4<f32>,
  @location(2) bgColor: vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var atlasTexture: texture_2d<f32>;
@group(0) @binding(2) var atlasSampler: sampler;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  let pixelPos = input.cellPos * uniforms.cellSize + input.position * uniforms.cellSize;
  let ndc = (pixelPos / uniforms.screenSize) * 2.0 - 1.0;
  output.position = vec4<f32>(ndc.x, -ndc.y, 0.0, 1.0);
  
  output.uv = mix(input.glyphUV0, input.glyphUV1, input.uv);
  output.fgColor = input.fgColor;
  output.bgColor = input.bgColor;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let glyphAlpha = textureSample(atlasTexture, atlasSampler, input.uv).r;
  let finalColor = mix(input.bgColor, input.fgColor, glyphAlpha);
  return finalColor;
}
`;

export class WebGpuRenderer {
  public readonly canvas: HTMLCanvasElement;
  private fallbackRenderer: CanvasRenderer;
  private isWebGpuSupported = false;

  private adapter: any = null;
  private device: any = null;
  private context: any = null;
  private pipeline: any = null;
  private atlas: GlyphAtlas;

  public charWidth = 9;
  public charHeight = 18;
  private dpr = 1;
  private options: ITerminalOptions;

  constructor(options: ITerminalOptions = {}) {
    this.options = options;
    this.fallbackRenderer = new CanvasRenderer(options);
    this.canvas = this.fallbackRenderer.canvas;
    this.atlas = new GlyphAtlas(this.dpr);
    this.initWebGpu();
  }

  private async initWebGpu(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !(navigator as any).gpu) {
      this.isWebGpuSupported = false;
      return false;
    }

    try {
      this.adapter = await (navigator as any).gpu.requestAdapter();
      if (!this.adapter) return false;

      this.device = await this.adapter.requestDevice();
      this.context = this.canvas.getContext('webgpu');
      if (!this.context) return false;

      this.isWebGpuSupported = true;
      return true;
    } catch {
      this.isWebGpuSupported = false;
      return false;
    }
  }

  public attach(container: HTMLElement): void {
    this.fallbackRenderer.attach(container);
  }

  public updateTheme(theme: TerminalTheme): void {
    this.fallbackRenderer.updateTheme(theme);
  }

  public setSelection(selection: SelectionRange | null): void {
    this.fallbackRenderer.setSelection(selection);
  }

  public setSearchMatches(matches: SearchMatch[]): void {
    this.fallbackRenderer.setSearchMatches(matches);
  }

  public setHoveredLink(link: HoveredLink | null): void {
    this.fallbackRenderer.setHoveredLink(link);
  }

  public setImages(images: TerminalImage[]): void {
    this.fallbackRenderer.setImages(images);
  }

  public updateScroll(viewportY: number, totalLines: number): void {
    this.fallbackRenderer.updateScroll(viewportY, totalLines);
  }

  public resize(cols: number, rows: number): void {
    this.fallbackRenderer.resize(cols, rows);
  }

  public applyDiff(diff: TerminalDiff): void {
    this.fallbackRenderer.applyDiff(diff);
  }

  public renderAll(): void {
    this.fallbackRenderer.renderAll();
  }

  public measureFont(): void {
    this.fallbackRenderer.measureFont();
    this.charWidth = this.fallbackRenderer.charWidth;
    this.charHeight = this.fallbackRenderer.charHeight;
  }

  public resizeCanvas(): void {
    this.fallbackRenderer.resizeCanvas();
  }

  public isSupported(): boolean {
    return this.isWebGpuSupported;
  }
}
