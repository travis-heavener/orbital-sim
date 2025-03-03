import { Body } from "./Body.mjs";
import { Scene } from "./Scene.mjs";

let scene: Scene;

$(() => {
    const canvas = $("canvas")[0] as HTMLCanvasElement;
    
    // Create Scene
    scene = new Scene(canvas, 20, 1e3/60);

    // Sim init
    init();
});

const init = () => {
    // Start Scene
    scene.start();

    // Create bodies
    scene.add(new Body({
        "pos": {"x": 0, "y": 0},
        "mass": 5.972e24,
        "radius": 6.378e6,
        "color": "#00b2d1"
    }));
};