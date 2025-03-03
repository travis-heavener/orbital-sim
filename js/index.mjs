import { Body } from "./Body.mjs";
import { Scene } from "./Scene.mjs";
let scene;
$(() => {
    const canvas = $("canvas")[0];
    // Create Scene
    scene = new Scene(canvas, 20, 1e3 / 60);
    // Sim init
    init();
});
const init = () => {
    // Start Scene
    scene.start();
    // Create bodies
    const bodyA = new Body({
        "pos": { "x": 0, "y": 0 },
        "mass": 5.972e24,
        "radius": 6.378e6,
        "color": "#b2d100"
    });
    scene.add(bodyA);
    const bodyB = new Body({
        "pos": { "x": 13e6, "y": 0 },
        "mass": 5.972e24,
        "radius": 6.378e6,
        "color": "#d100b2"
    });
    scene.add(bodyB);
};
