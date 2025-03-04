import { SceneOpts } from "./Scene.mjs";
import { calcNewtonianGrav, uuidv4 } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";

type ForcesCache = {
    bodyID: string,
    force: Vector2
};

export class Body {
    id: string; // UUID for each body
    pos: {x: number, y: number}; // Object x-y position, in meters
    mass: number; // Body mass, in KG
    radius: number; // Body radius, in meters

    // Render properties
    #color: string;

    // Cached gravitational forces between other bodies
    #forcesCache: ForcesCache;

    constructor(opts: {pos: {x: number, y: number}, mass: number, radius: number, color?: string}) {
        this.id = uuidv4();
        this.pos = opts.pos;
        this.mass = opts.mass;
        this.radius = opts.radius;
        this.#color = opts?.color ?? "#d01dd9";
        this.#forcesCache = {} as ForcesCache;
    }

    // Tick method
    tick(bodies: Body[]) {
        // Calculate force from all other bodies
        for (const body of bodies) {
            if (body.id === this.id) continue; // Skip this

            if (!Object.hasOwn(this.#forcesCache, body.id))
                calcNewtonianGrav(this, body);

            const force = this.#forcesCache[body.id];
        }
    }

    // Render method
    render(ctx: CanvasRenderingContext2D, sceneOpts: SceneOpts) {
        // Determine scaled radius
        const { mPerPx, width, height } = sceneOpts;
        
        const x = (sceneOpts.center.x - this.pos.x) / mPerPx;
        const y = (sceneOpts.center.y - this.pos.y) / mPerPx;
        const radius = this.radius / mPerPx;

        // Draw from center-origin
        ctx.beginPath();
        ctx.arc(width/2 - x, height/2 + y, radius, 0, 2 * Math.PI);

        // Fill
        ctx.fillStyle = this.#color;
        ctx.fill();
    }

    // Clear forces cache
    clearForcesCache() {
        Object.getOwnPropertyNames(this.#forcesCache)
            .forEach(pair => delete this.#forcesCache[pair]);
    }

    // Cache a force from a Body to prevent duplicate calculations
    cacheForce(bodyID: string, force: Vector2) {
        this.#forcesCache[bodyID] = force;
    }
};