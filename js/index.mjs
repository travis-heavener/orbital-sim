import { earthMoon } from "./presets.mjs";
import { Scene } from "./Scene.mjs";
let scene;
$(() => {
    const canvas = $("canvas")[0];
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
