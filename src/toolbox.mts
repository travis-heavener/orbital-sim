import { Body } from "./Body.mjs";
import { Vector2 } from "./Vector2.mjs";

// Adjust canvas size based on viewport
export const adjustViewport = (canvas: HTMLCanvasElement): [number, number] => {
    // Update canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    $(canvas).css({"width": canvas.width, "height": canvas.height});

    return [canvas.width, canvas.height];
}

// Calculate gravitational force between two components
export const calcNewtonianGrav = (bodyA: Body, bodyB: Body) => {
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
    bodyB.cacheForce(bodyA.id, Vector2.flip(force));

    // Check for collision
    if (Math.sqrt(distSquared) < bodyA.radius + bodyB.radius) {
        bodyA.cacheCollision(bodyB);
        bodyB.cacheCollision(bodyA);
    }
};

// Create a v4 UUID (https://stackoverflow.com/a/2117523)
export const uuidv4 = () => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}