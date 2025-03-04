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
    #isDestroyed = false; // Freed on next tick when true
    // Cached data between other bodies
    #forcesCache;
    #collidedBodies;
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
        this.#collidedBodies = [];
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
        const { x, y } = this.getDrawnPos(sceneOpts);
        const radius = this.radius / mPerPx;
        // Detect if the Body was drawn in frame
        this.#isVisible = (x + radius > 0 && x - radius < width) && (y + radius > 0 && y - radius < height);
        // Skip drawing if off screen
        if (!this.#isVisible)
            return;
        // Draw from center-origin
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        // Fill
        ctx.fillStyle = this.#color;
        ctx.fill();
    }
    // Clear physics caches
    clearCache() {
        Object.getOwnPropertyNames(this.#forcesCache)
            .forEach(pair => delete this.#forcesCache[pair]);
    }
    // Cache a force from a Body to prevent duplicate calculations
    cacheForce(bodyID, force) {
        this.#forcesCache[bodyID] = force;
    }
    // Cache collision data between bodies
    cacheCollision(body) { this.#collidedBodies.push(body); }
    // Calculate the position of the object on the canvas after scaling
    getDrawnPos(sceneOpts) {
        return new Vector2(sceneOpts.width / 2 - (sceneOpts.center.x - this.pos.x) / sceneOpts.mPerPx, sceneOpts.height / 2 + (sceneOpts.center.y - this.pos.y) / sceneOpts.mPerPx);
    }
    isVisible() { return this.#isVisible; }
    isDestroyed() { return this.#isDestroyed; }
    destroy() { this.#isDestroyed = true; }
    getCollidedBodies() { return this.#collidedBodies; }
    // Static methods
    // Combine two Body objects into one
    static merge(...bodiesArr) {
        // Collect all collided bodies
        const bodies = new Set(bodiesArr);
        const bodiesToTraverse = [...bodiesArr];
        while (bodiesToTraverse.length) {
            const body = bodiesToTraverse.shift();
            for (const auxBody of body.getCollidedBodies()) {
                if (!bodies.has(auxBody)) {
                    bodies.add(auxBody);
                    bodiesToTraverse.push(auxBody);
                }
            }
        }
        // Calculate telemetry
        let mf = 0;
        let rfCubed = 0;
        const pf = new Vector2();
        const vf = new Vector2();
        const af = new Vector2();
        const color = [0, 0, 0];
        for (const body of bodies) {
            mf += body.mass;
            rfCubed += body.radius ** 3;
            pf.add(new Vector2(body.pos).scale(body.mass));
            vf.add(new Vector2(body.velocity).scale(body.mass));
            af.add(new Vector2(body.accel).scale(body.mass));
            // Average colors
            color[0] += parseInt(body.#color.substring(1, 3), 16);
            color[1] += parseInt(body.#color.substring(3, 5), 16);
            color[2] += parseInt(body.#color.substring(5, 7), 16);
            // Mark as destroyed
            body.destroy();
        }
        // Mix color channels
        color[0] /= bodies.size;
        color[1] /= bodies.size;
        color[2] /= bodies.size;
        const formatComp = (c) => (~~c).toString(16).padStart(2, "0");
        const colorHex = `#${formatComp(color[0])}${formatComp(color[1])}${formatComp(color[2])}`;
        // Divide by total mass
        pf.scale(1 / mf);
        vf.scale(1 / mf);
        af.scale(1 / mf);
        // Create new Body
        return new Body({
            "pos": pf,
            "velocity": vf,
            "accel": af,
            "mass": mf,
            "color": colorHex,
            "radius": Math.cbrt(rfCubed)
        });
    }
}
;
