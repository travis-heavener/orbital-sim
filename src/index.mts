import { Body } from "./Body.mjs";
import { Scene } from "./Scene.mjs";
import { Vector2 } from "./Vector2.mjs";

let scene: Scene;

$(() => {
    const canvas = $("canvas")[0] as HTMLCanvasElement;

    // Create Scene
    scene = new Scene(canvas, 20, 100);

    // Sim init
    init();
});

const init = () => {
    // Start Scene
    scene.start();

    // Create bodies
    const bodyA = new Body({
        "pos": new Vector2(0, 0),
        "mass": 5.972e24,
        "radius": 6.378e6 * 3,
        "color": "#b2d100",
        "name": "Earth"
    });
    scene.add(bodyA);

    const bodyB = new Body({
        "pos": new Vector2(3.844e8, 0),
        "velocity": new Vector2(0, 1.022e3),
        "mass": 7.348e22,
        "radius": 1.740e6 * 3,
        "color": "#d100b2",
        "name": "Moon"
    });
    scene.add(bodyB);

    // Timewarp
    scene.setZoom(0.18);
    scene.setTimewarpScale(1e6);
};