import { calcNewtonianGrav, uuidv4 } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
export class Body {
    id; // UUID for each body
    pos; // Cartesian coordinates, in meters
    velocity; // Body velocity components, in m/s
    accel; // Body velocity components, in m/s/s
    mass; // Body mass, in KG
    radius; // Body radius, in meters
    name; // Body name
    // Render properties
    #color;
    #isVisible = false;
    // Cached gravitational forces between other bodies
    #forcesCache;
    constructor(opts) {
        this.id = uuidv4();
        this.pos = opts.pos;
        this.velocity = opts?.velocity ?? new Vector2();
        this.accel = opts?.accel ?? new Vector2();
        this.mass = opts.mass;
        this.radius = opts.radius;
        this.name = opts?.name ?? "";
        this.#color = opts?.color ?? "#d01dd9";
        this.#forcesCache = {};
    }
    // Tick method
    tick(bodies, dt) {
        // Calculate force from all other bodies
        const F_net = new Vector2();
        for (const body of bodies) {
            if (body.id === this.id)
                continue; // Skip this
            if (!Object.hasOwn(this.#forcesCache, body.id))
                calcNewtonianGrav(this, body);
            F_net.add(this.#forcesCache[body.id]);
        }
        // Update telemetry
        F_net.scale(1 / this.mass);
        this.accel = F_net;
        this.velocity.add(Vector2.scale(this.accel, dt));
        this.pos.add(Vector2.scale(this.velocity, dt));
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
        // Detect if the Body was drawn in frame
        if (this.name === "Earth")
            if ((x + radius > 0 && x - radius < width) && (y + radius > 0 && y - radius < height)) {
                this.#isVisible = true;
                console.log(true);
            }
            else {
                console.log(false);
            }
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
