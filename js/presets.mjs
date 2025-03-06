import { Body } from "./Body.mjs";
import { Vector2 } from "./Vector2.mjs";
export const solarSystem = (scene) => {
    // Create bodies
    const sun = new Body({
        "pos": new Vector2(0, 0),
        "mass": 1.989e30,
        "radius": 6.957e8,
        "color": "#d0ff00",
        "name": "Sun"
    });
    const mercury = new Body({
        "pos": new Vector2(5.8e10, 0),
        "velocity": new Vector2(0, 47_360),
        "mass": 3.30e23,
        "radius": 2.44e6,
        "color": "#a4a4a4",
        "name": "Mercury"
    });
    const venus = new Body({
        "pos": new Vector2(1.08e11, 0),
        "velocity": new Vector2(0, 35_000),
        "mass": 4.867e24,
        "radius": 6.052e6,
        "color": "#d67e26",
        "name": "Venus"
    });
    const earth = new Body({
        "pos": new Vector2(1.49e11, 0),
        "velocity": new Vector2(0, 29_780),
        "mass": 5.972e24,
        "radius": 6.378e6,
        "color": "#4d8feb",
        "name": "Earth"
    });
    const mars = new Body({
        "pos": new Vector2(2.28e11, 0),
        "velocity": new Vector2(0, 24_080),
        "mass": 6.417e23,
        "radius": 3.390e6,
        "color": "#bd4944",
        "name": "Mars"
    });
    const jupiter = new Body({
        "pos": new Vector2(7.78e11, 0),
        "velocity": new Vector2(0, 13_060),
        "mass": 1.898e27,
        "radius": 6.991e7,
        "color": "#bf9569",
        "name": "Jupiter"
    });
    const saturn = new Body({
        "pos": new Vector2(1.40e12, 0),
        "velocity": new Vector2(0, 9_670),
        "mass": 5.683e26,
        "radius": 6.025e7,
        "color": "#e5bb76",
        "name": "Saturn"
    });
    const uranus = new Body({
        "pos": new Vector2(2.87e12, 0),
        "velocity": new Vector2(0, 6_790),
        "mass": 8.682e25,
        "radius": 2.556e7,
        "color": "#0492ba",
        "name": "Uranus"
    });
    const neptune = new Body({
        "pos": new Vector2(4.51e12, 0),
        "velocity": new Vector2(0, 5_450),
        "mass": 1.024e26,
        "radius": 2.476e7,
        "color": "#3c5bd9",
        "name": "Neptune"
    });
    const pluto = new Body({
        "pos": new Vector2(5.87e12, 0),
        "velocity": new Vector2(0, 4_640),
        "mass": 1.303e22,
        "radius": 1.188e6,
        "color": "#7d6c67",
        "name": "Pluto"
    });
    // Visual scaling
    sun.radius *= 40;
    mercury.radius *= 500;
    venus.radius *= 500;
    earth.radius *= 500;
    mars.radius *= 500;
    jupiter.radius *= 250;
    saturn.radius *= 250;
    uranus.radius *= 500;
    neptune.radius *= 500;
    pluto.radius *= 500;
    // Add to scene
    scene.add(sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto);
    // Timewarp
    scene.setZoom(6e3);
    scene.setTimewarp(2e6);
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
    scene.setZoom(4.5);
    scene.setTimewarp(2e5);
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
    scene.setTimewarp(5e4);
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
    scene.add(bodyA, bodyB, bodyC);
    // Timewarp
    scene.setTimewarp(1e4);
};
