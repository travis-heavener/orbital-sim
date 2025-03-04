import { Vector2 } from "./Vector2.mjs";
// Adjust canvas size based on viewport
export const adjustViewport = (canvas) => {
    // Calculate canvas dimensions
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;
    const size = ~~Math.min(80 * vw, 80 * vh);
    // Update canvas dimensions
    canvas.width = canvas.height = size;
    $(canvas).css({ "width": canvas.width, "height": canvas.height });
    return [size, size];
};
// Calculate gravitational force between two components
export const calcNewtonianGrav = (bodyA, bodyB) => {
    // Calculate the gravitational force between both bodies
    const G = 6.6743e-11; // Gravitational constnat
    const m1m2 = bodyA.mass * bodyB.mass;
    const dx = bodyB.pos.x - bodyA.pos.x;
    const dy = bodyB.pos.y - bodyA.pos.y;
    const distSquared = dx ** 2 + dy ** 2;
    const theta = Math.atan2(dy, dx);
    // Cache for bodyA
    const force = Vector2.fromAngle(theta, G * m1m2 / distSquared); // Scale by force magnitude
    bodyA.cacheForce(bodyB.id, force);
    // Flip & cache for bodyB
    force.flip();
    bodyB.cacheForce(bodyA.id, force);
};
// Create a v4 UUID (https://stackoverflow.com/a/2117523)
export const uuidv4 = () => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
};
