import { Body } from "./Body.mjs";
import { earthMoon, twoBodyProblem } from "./presets.mjs";
import { Scene } from "./Scene.mjs";
import { Vector2 } from "./Vector2.mjs";

let scene: Scene;

$(() => {
    const canvas = $("canvas")[0] as HTMLCanvasElement;

    // Create Scene
    globalThis.scene = scene = new Scene(canvas, 20, 100);

    // Sim init
    init();
});

const init = () => {
    // Start Scene
    scene.start();

    // Load preset
    earthMoon(scene);
    // twoBodyProblem(scene);
};