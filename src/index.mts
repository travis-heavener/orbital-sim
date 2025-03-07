import { Body } from "./Body.mjs";
import { scenes } from "./presets.mjs";
import { Scene } from "./Scene.mjs";
import { Vector2 } from "./Vector2.mjs";

let scene: Scene;

$(() => {
    const canvas = $("canvas")[0] as HTMLCanvasElement;

    // Create Scene
    scene = new Scene(canvas);

    // Populate scene picker
    const scenePicker = $("#scene-picker");
    for (const [ name, loadPreset ] of Object.entries(scenes)) {
        const elem = document.createElement("H2");
        elem.innerText = name;
        $(elem).on("click", () => {
            loadPreset(scene); // Load scene
            scenePicker.hide(); // Hide scene picker
            $("#controls-overlay").css("display", "flex"); // Show controls
            history.pushState({}, "", "?s=" + encodeURIComponent(name)); // Push state
        });
        scenePicker.append(elem);
    }

    // Check for query string
    handlePopState();

    // Expose globals to dev console
    exposeGlobals();

    // Bind popstate listener
    $(window).on("popstate", () => handlePopState());
});

const handlePopState = () => {
    const sceneID = new URLSearchParams(location.search).get("s");
    if (sceneID !== null && scenes[sceneID]) {
        scenes[sceneID](scene); // Load scene
        $("#scene-picker").hide(); // Hide scene picker
        $("#controls-overlay").css("display", "flex"); // Show controls
    } else { // Reveal scene picker
        scene.reset(); // Reset scene
        $("#scene-picker").css("display", "flex"); // Show scene picker
        $("#controls-overlay").hide(); // Hide controls
    }
};

// If you really want to defeat the purpose of module scopes (ie. toy with things in the JS console, invoke this function)
const exposeGlobals = globalThis.exposeGlobals = () => {
    globalThis.scene = scene;
    globalThis.Body = Body;
    globalThis.Vector2 = Vector2;
};