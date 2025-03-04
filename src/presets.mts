import { Body } from "./Body.mjs";
import { Scene } from "./Scene.mjs";
import { Vector2 } from "./Vector2.mjs";

export const solarSystem = (scene: Scene) => {
    // Create bodies
    const sun = new Body({
        "pos": new Vector2(0, 0),
        "mass": 1.9891e30,
        "radius": 7e8 * 10,
        "color": "#d0ff00",
        "name": "Sun (x10)"
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
        "color": "#0c8532",
        "name": "Earth (x500)"
    });

    // Add to scene
    scene.add(sun);
    scene.add(mercury);
    scene.add(venus);
    scene.add(earth);

    // Timewarp
    scene.setZoom(0.0006);
    scene.setTimewarpScale(2e6);

    // Track Earth
    scene.track(sun);
};

export const earthMoon = (scene: Scene) => {
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

export const twoBodyProblem = (scene: Scene) => {
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