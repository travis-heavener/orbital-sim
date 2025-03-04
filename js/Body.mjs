import { calcNewtonianGrav, uuidv4 } from "./toolbox.mjs";
export class Body {
    id; // UUID for each body
    pos; // Object x-y position, in meters
    mass; // Body mass, in KG
    radius; // Body radius, in meters
    // Render properties
    #color;
    // Cached gravitational forces between other bodies
    #forcesCache;
    constructor(opts) {
        this.id = uuidv4();
        this.pos = opts.pos;
        this.mass = opts.mass;
        this.radius = opts.radius;
        this.#color = opts?.color ?? "#d01dd9";
        this.#forcesCache = {};
    }
    // Tick method
    tick(bodies) {
        // Calculate force from all other bodies
        for (const body of bodies) {
            if (body.id === this.id)
                continue; // Skip this
            if (!Object.hasOwn(this.#forcesCache, body.id))
                calcNewtonianGrav(this, body);
            const force = this.#forcesCache[body.id];
        }
    }
    // Render method
    render(ctx, sceneOpts) {
        // Determine scaled radius
        const { mPerPx, width, height } = sceneOpts;
        const x = (sceneOpts.center.x - this.pos.x) / mPerPx;
        const y = (sceneOpts.center.y - this.pos.y) / mPerPx;
        const radius = this.radius / mPerPx;
        // Draw from center-origin
        ctx.beginPath();
        ctx.arc(width / 2 - x, height / 2 + y, radius, 0, 2 * Math.PI);
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
    cacheForce(bodyID, force) {
        this.#forcesCache[bodyID] = force;
    }
}
;
