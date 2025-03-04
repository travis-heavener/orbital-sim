import { Body } from "./Body.mjs";
import { Vector2 } from "./Vector2.mjs";
export const earthMoon = (scene) => {
    // Create bodies
    const bodyA = new Body({
        "pos": new Vector2(0, 0),
        "mass": 5.972e24,
        "radius": 6.378e6,
        "color": "#0c8532",
        "name": "Earth"
    });
    const bodyB = new Body({
        "pos": new Vector2(3.844e8, 0),
        "velocity": new Vector2(0, 1.022e3),
        "mass": 7.348e22,
        "radius": 1.740e6,
        "color": "#a4a4a4",
        "name": "Moon"
    });
    scene.add(bodyA);
    scene.add(bodyB);
    // Timewarp
    scene.setZoom(0.24);
    scene.setTimewarpScale(2e5);
    // Track Earth
    scene.track(bodyA);
};
export const twoBodyProblem = (scene) => {
    const bodyA = new Body({
        "pos": new Vector2(-4e7, 0),
        "velocity": new Vector2(0, -1e3),
        "mass": 5e24,
        "radius": 8e6,
        "color": "#ea210c",
        "name": "Body A"
    });
    const bodyB = new Body({
        "pos": new Vector2(4e7, 0),
        "velocity": new Vector2(0, 1e3),
        "mass": 5e24,
        "radius": 8e6,
        "color": "#0cea21",
        "name": "Body B"
    });
    scene.add(bodyA);
    scene.add(bodyB);
    // Timewarp
    scene.setTimewarpScale(5e4);
};
