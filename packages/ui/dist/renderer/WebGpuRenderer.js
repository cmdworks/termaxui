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
    canvas;
    fallbackRenderer;
    isWebGpuSupported = false;
    adapter = null;
    device = null;
    context = null;
    pipeline = null;
    atlas;
    charWidth = 9;
    charHeight = 18;
    dpr = 1;
    options;
    constructor(options = {}) {
        this.options = options;
        this.fallbackRenderer = new CanvasRenderer(options);
        this.canvas = this.fallbackRenderer.canvas;
        this.atlas = new GlyphAtlas(this.dpr);
        this.initWebGpu();
    }
    async initWebGpu() {
        if (typeof navigator === 'undefined' || !navigator.gpu) {
            this.isWebGpuSupported = false;
            return false;
        }
        try {
            this.adapter = await navigator.gpu.requestAdapter();
            if (!this.adapter)
                return false;
            this.device = await this.adapter.requestDevice();
            this.context = this.canvas.getContext('webgpu');
            if (!this.context)
                return false;
            this.isWebGpuSupported = true;
            return true;
        }
        catch {
            this.isWebGpuSupported = false;
            return false;
        }
    }
    attach(container) {
        this.fallbackRenderer.attach(container);
    }
    updateTheme(theme) {
        this.fallbackRenderer.updateTheme(theme);
    }
    setSelection(selection) {
        this.fallbackRenderer.setSelection(selection);
    }
    setSearchMatches(matches) {
        this.fallbackRenderer.setSearchMatches(matches);
    }
    setHoveredLink(link) {
        this.fallbackRenderer.setHoveredLink(link);
    }
    setImages(images) {
        this.fallbackRenderer.setImages(images);
    }
    updateScroll(viewportY, totalLines) {
        this.fallbackRenderer.updateScroll(viewportY, totalLines);
    }
    resize(cols, rows) {
        this.fallbackRenderer.resize(cols, rows);
    }
    applyDiff(diff) {
        this.fallbackRenderer.applyDiff(diff);
    }
    renderAll() {
        this.fallbackRenderer.renderAll();
    }
    measureFont() {
        this.fallbackRenderer.measureFont();
        this.charWidth = this.fallbackRenderer.charWidth;
        this.charHeight = this.fallbackRenderer.charHeight;
    }
    resizeCanvas() {
        this.fallbackRenderer.resizeCanvas();
    }
    isSupported() {
        return this.isWebGpuSupported;
    }
}
