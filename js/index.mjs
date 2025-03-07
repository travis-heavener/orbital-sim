import { Body } from "./Body.mjs";
import { scenes } from "./presets.mjs";
import { Scene } from "./Scene.mjs";
import { Vector2 } from "./Vector2.mjs";
let scene;
$(() => {
    const canvas = $("canvas")[0];
    // Create Scene
    scene = new Scene(canvas);
    // Load scenes
    const scenePicker = $("#scene-picker");
    for (const [name, loadPreset] of Object.entries(scenes)) {
        const elem = document.createElement("H2");
        elem.innerText = name;
        $(elem).on("click", () => {
            loadPreset(scene); // Load scene
            scene.start(); // Start sim
            scenePicker.hide(); // Hide scene picker
            $("#controls-overlay").show(); // Show controls
        });
        scenePicker.append(elem);
    }
    // Expose globals to dev console
    exposeGlobals();
});
// If you really want to defeat the purpose of module scopes (ie. toy with things in the JS console, invoke this function)
const exposeGlobals = globalThis.exposeGlobals = () => {
    globalThis.scene = scene;
    globalThis.Body = Body;
    globalThis.Vector2 = Vector2;
};
