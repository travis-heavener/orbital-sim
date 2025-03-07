import { Body } from "./Body.mjs";
import * as presets from "./presets.mjs";
import { Scene } from "./Scene.mjs";
import { Vector2 } from "./Vector2.mjs";
let scene;
$(() => {
    const canvas = $("canvas")[0];
    // Create Scene
    scene = new Scene(canvas);
    // Sim init
    init();
});
const init = () => {
    // Start Scene
    scene.start();
    // Load preset
    // presets.solarSystem(scene);
    // presets.earthMoon(scene);
    // presets.twoBodyProblem(scene);
    presets.threeDoomedBodies(scene);
    // Expose globals to dev console
    exposeGlobals();
};
// If you really want to defeat the purpose of module scopes (ie. toy with things in the JS console, invoke this function)
const exposeGlobals = globalThis.exposeGlobals = () => {
    globalThis.scene = scene;
    globalThis.Body = Body;
    globalThis.Vector2 = Vector2;
};
