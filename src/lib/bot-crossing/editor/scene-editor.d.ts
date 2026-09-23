export type EditorMode = "translate" | "rotate" | "scale";

export interface EditorState {
  enabled: boolean;
  mode: EditorMode;
  snap: boolean;
  selectedId: string | null;
  selectedLabel: string | null;
  pose: {
    position: number[];
    rotation: number[];
    scale: number[];
  } | null;
}

export class SceneEditor {
  enabled: boolean;
  constructor(opts: {
    camera: unknown;
    renderer: unknown;
    scene: unknown;
    roots: unknown[];
    rig: unknown;
  });
  onChange(fn: (state: EditorState) => void): () => void;
  setEnabled(on: boolean): void;
  setMode(mode: EditorMode): void;
  setSnap(on: boolean): void;
  resetSelected(): void;
  resetAll(): void;
  exportJSON(): Record<string, unknown>;
  dispose(): void;
}
