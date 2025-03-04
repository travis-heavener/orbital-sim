import { Body } from "./Body.mjs";
import { Vector2 } from "./Vector2.mjs";
export const solarSystem = (scene) => {
    // Create bodies
    const sun = new Body({
        "pos": new Vector2(0, 0),
        "mass": 1.9891e30,
        "radius": 7e8 * 25,
        "color": "#d0ff00",
        "name": "Sun (x25)"
    });
    const mercury = new Body({
        "pos": new Vector2(5.8e10, 0),
        "velocity": new Vector2(0, 47_360),
        "mass": 3.30e23,
        "radius": 2.44e6 * 500,
        "color": "#a4a4a4",
        "name": "Mercury (x500)"
    });
    const venus = new Body({
        "pos": new Vector2(1.08e11, 0),
        "velocity": new Vector2(0, 35_000),
        "mass": 4.867e24,
        "radius": 6.052e6 * 500,
        "color": "#ad5f10",
        "name": "Venus (x500)"
    });
    const earth = new Body({
        "pos": new Vector2(1.49e11, 0),
        "velocity": new Vector2(0, 29_780),
        "mass": 5.972e24,
        "radius": 6.378e6 * 500,
        "color": "#4d8feb",
        "name": "Earth (x500)"
    });
    const mars = new Body({
        "pos": new Vector2(2.28e11, 0),
        "velocity": new Vector2(0, 24_080),
        "mass": 6.417e23,
        "radius": 3.390e6 * 500,
        "color": "#b56765",
        "name": "Mars (x500)"
    });
    // Add to scene
    scene.add(sun);
    scene.add(mercury);
    scene.add(venus);
    scene.add(earth);
    scene.add(mars);
    // Timewarp
    scene.setZoom(0.0006);
    scene.setTimewarpScale(2e6);
    // Track Earth
    scene.track(sun);
};
export const earthMoon = (scene) => {
    // Create bodies
    const bodyA = new Body({
        "pos": new Vector2(0, 0),
        "mass": 5.972e24,
        "radius": 6.378e6,
        "color": "#4d8feb",
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
export const threeDoomedBodies = (scene) => {
    const bodyA = new Body({
        "pos": new Vector2(4e7, 0),
        "mass": 2e24,
        "radius": 8e6,
        "color": "#ea210c",
        "name": "Body A"
    });
    const bodyB = new Body({
        "pos": new Vector2(0, 4e7),
        "velocity": new Vector2(1e3, 0),
        "mass": 5e24,
        "radius": 8e6,
        "color": "#0cea21",
        "name": "Body B"
    });
    const bodyC = new Body({
        "pos": new Vector2(-4e7, 0),
        "velocity": new Vector2(0, 3e3),
        "mass": 2e25,
        "radius": 8e6,
        "color": "#210cea",
        "name": "Body C"
    });
    scene.add(bodyA);
    scene.add(bodyB);
    scene.add(bodyC);
    // Timewarp
    scene.setZoom(0.75);
    scene.setTimewarpScale(1e4);
};
