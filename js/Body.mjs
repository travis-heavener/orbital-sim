import { uuidv4 } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
const G = 6.6743e-11; // Gravitational constant
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
        this.#collidedBodies = [];
    }
    // Tick method
    tick(bodies, dt) {
        // Calculate force from all other bodies
        this.accel.x = this.accel.y = 0;
        for (let i = 0; i < bodies.length; ++i) {
            if (bodies[i].id === this.id)
                continue; // Skip this
            const body = bodies[i];
            // Calculate the gravitational force between both bodies
            const dx = body.pos.x - this.pos.x;
            const dy = body.pos.y - this.pos.y;
            const distSquared = dx * dx + dy * dy;
            const theta = Math.atan2(dy, dx);
            // Check for collision
            if (Math.sqrt(distSquared) < this.radius + body.radius) {
                this.#collidedBodies.push(body);
                body.#collidedBodies.push(this);
            }
            const force = Vector2.fromAngle(theta, G * this.mass * body.mass / distSquared);
            this.accel.x += force.x;
            this.accel.y += force.y;
        }
        // Update telemetry
        this.velocity.x += this.accel.x * dt / this.mass;
        this.velocity.y += this.accel.y * dt / this.mass;
        this.pos.x += this.velocity.x * dt;
        this.pos.y += this.velocity.y * dt;
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
            const collidedBodies = body.getCollidedBodies();
            for (let i = 0; i < collidedBodies.length; ++i) {
                if (!bodies.has(collidedBodies[i])) {
                    bodies.add(collidedBodies[i]);
                    bodiesToTraverse.push(collidedBodies[i]);
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
            // Calculate position
            pf.x += body.pos.x * body.mass;
            pf.y += body.pos.y * body.mass;
            // Calculate velocity
            vf.x += body.velocity.x * body.mass;
            vf.y += body.velocity.y * body.mass;
            // Calculate accel
            af.x += body.accel.x * body.mass;
            af.y += body.accel.y * body.mass;
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
        pf.div(mf);
        vf.div(mf);
        af.div(mf);
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
