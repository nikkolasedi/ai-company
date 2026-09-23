import { installWorldCurve, setCurveView, CURVE_FULL } from "./core/curve.js";
import { Engine } from "./core/engine.js";
import { CameraRig } from "./core/camera.js";
import { Settings, hasStoredSettings } from "./core/settings.js";
import { Colony } from "./game/colony.js";
import { loadKit } from "./world/kit.js";
import { loadCrew, crewRig } from "./agents/crew.js";
import { loadHumans, humanRigs } from "./agents/humans.js";
import { PLANETS } from "./world/planet.js";
import { SceneEditor } from "./editor/scene-editor.js";
import { campusObstacles } from "./world/campus.js";
import type { BotCrossingThread } from "./adapters/agent-to-thread";

/** Survives leaving the office and coming back, so the ship walk-out plays once per session. */
const seenAgents: Record<string, number> = {};

export interface ColonyRuntime {
  engine: Engine;
  colony: Colony;
  rig: CameraRig;
  settings: Settings;
  applyThreads: (threads: BotCrossingThread[]) => void;
  pickAgent: (ndcX: number, ndcY: number, aspect: number) => string | null;
  editor: SceneEditor;
  dispose: () => void;
}

export async function bootColony(container: HTMLElement): Promise<ColonyRuntime> {
  installWorldCurve();

  const settings = new Settings();
  if (!hasStoredSettings()) {
    settings.applyPreset("medium");
  }
  settings.set("planet", "office");
  settings.set("timeOfDay", 0.38);
  settings.set("autoTime", false);
  settings.set("clockTime", false);
  settings.set("stars", false);
  settings.set("exposure", 0.88);
  settings.set("iblIntensity", 0.55);
  settings.set("bloomStrength", 0.12);

  const engine = new Engine(settings).mount(container);
  const planetKey = settings.get("planet") as keyof typeof PLANETS;
  engine.setPlanetGrade(PLANETS[planetKey]?.grade);
  const rig = new CameraRig(engine.camera, engine.canvas, settings);
  const colony = new Colony(engine.scene, settings, engine.camera, engine.renderer);

  const settle = (p: Promise<unknown>) =>
    p.then(() => null, (err: unknown) => err);

  const [kitError, humanError] = await Promise.all([settle(loadKit()), settle(loadHumans())]);

  if (!kitError && !humanError) {
    colony.astronauts.setHumans(humanRigs());
    colony.onAssetsReady();
  } else {
    const crewError = kitError ? kitError : await settle(loadCrew());
    if (!kitError && !crewError) {
      colony.astronauts.setRig(crewRig());
      colony.onAssetsReady();
    } else {
      console.error("[BotCrossing] asset load failed:", kitError || humanError || crewError);
    }
  }

  const applyThreads = (list: BotCrossingThread[]) => {
    const known = new Set(Object.keys(seenAgents));
    for (const thread of list) {
      if (!seenAgents[thread.id]) seenAgents[thread.id] = Date.now();
    }
    colony.setThreads(list, new Set(), new Set(), known);
  };

  const editor = new SceneEditor({
    camera: engine.camera,
    renderer: engine.renderer,
    scene: engine.scene,
    roots: [engine.scene, colony.plotGroup],
    rig,
  });
  colony.editor = editor;
  let navTimer: ReturnType<typeof setTimeout> | undefined;
  editor.onChange(() => {
    if (colony.campus) colony.campus.userData.obstacles = campusObstacles(colony.campus);
    clearTimeout(navTimer);
    navTimer = setTimeout(() => colony._rebuildNavigation(), 180);
  });

  engine.add({
    update(dt: number, elapsed: number) {
      rig.update(dt);
      setCurveView(rig.target, rig.azimuth, settings.get("worldCurve") * CURVE_FULL);
      colony.update(dt, elapsed, rig.target);
      engine.setFocusDistance(rig.distance);
    },
  });

  engine.start();

  return {
    engine,
    colony,
    rig,
    settings,
    editor,
    applyThreads,
    pickAgent(ndcX, ndcY, aspect) {
      if (editor.enabled) return null;
      const hit = colony.pick(ndcX, ndcY, aspect);
      return hit?.id ?? null;
    },
    dispose() {
      editor.dispose();
      engine.stop();
      engine.dispose();
      colony.dispose();
    },
  };
}
