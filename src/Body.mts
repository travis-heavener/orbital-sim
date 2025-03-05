import { SceneOpts } from "./Scene.mjs";
import { calcNewtonianGrav, uuidv4 } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";

type ForcesCache = {
    bodyID: string,
    force: Vector2
};

export class Body {
    id: string; // UUID for each body

    pos: Vector2; // Cartesian coordinates, in meters
    velocity: Vector2; // Body velocity components, in m/s
    accel: Vector2; // Body velocity components, in m/s/s
    mass: number; // Body mass, in KG
    radius: number; // Body radius, in meters
    name: string; // Body name

    // Render properties
    #color: string;
    #isVisible = false;
    #isDestroyed = false; // Freed on next tick when true

    // Cached data between other bodies
    #forcesCache: ForcesCache;
    #collidedBodies: Body[];

    constructor(opts: {pos: Vector2, velocity?: Vector2, accel?: Vector2, mass: number, radius: number, color?: string, name?: string}) {
        this.id = uuidv4();

        this.pos = opts.pos;
        this.velocity = opts?.velocity ?? new Vector2();
        this.accel = opts?.accel ?? new Vector2();
        this.mass = opts.mass;
        this.radius = opts.radius;
        this.name = opts?.name ?? "";

        this.#color = opts?.color ?? "#d01dd9";
        this.#forcesCache = {} as ForcesCache;
        this.#collidedBodies = [];
    }

    // Tick method
    tick(bodies: Body[], dt: number) {
        // Calculate force from all other bodies
        const F_net = new Vector2();
        for (let i = 0; i < bodies.length; ++i) {
            if (bodies[i].id === this.id) continue; // Skip this

            if (!this.#forcesCache[bodies[i].id])
                calcNewtonianGrav(this, bodies[i]);

            F_net.add(this.#forcesCache[bodies[i].id]);
        }

        // Update telemetry
        F_net.div(this.mass);
        this.accel.assign(F_net);
        this.velocity.add(this.accel.x * dt, this.accel.y * dt);
        this.pos.add(this.velocity.x * dt, this.velocity.y * dt);
    }

    // Render method
    render(ctx: CanvasRenderingContext2D, sceneOpts: SceneOpts) {
        // Determine scaled radius
        const { mPerPx, width, height } = sceneOpts;
        const { x, y } = this.getDrawnPos(sceneOpts);
        const radius = this.radius / mPerPx;

        // Detect if the Body was drawn in frame
        this.#isVisible = (x + radius > 0 && x - radius < width) && (y + radius > 0 && y - radius < height);

        // Skip drawing if off screen
        if (!this.#isVisible) return;
    
        // Draw from center-origin
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);

        // Fill
        ctx.fillStyle = this.#color;
        ctx.fill();
    }

    // Clear physics caches
    clearCache() {
        this.#forcesCache = {} as ForcesCache;
    }

    // Cache a force from a Body to prevent duplicate calculations
    cacheForce(bodyID: string, force: Vector2) {
        this.#forcesCache[bodyID] = force;
    }

    // Cache collision data between bodies
    cacheCollision(body: Body) { this.#collidedBodies.push(body); }

    // Calculate the position of the object on the canvas after scaling
    getDrawnPos(sceneOpts: SceneOpts): Vector2 {
        return new Vector2(
            sceneOpts.width/2 - (sceneOpts.center.x - this.pos.x) / sceneOpts.mPerPx,
            sceneOpts.height/2 + (sceneOpts.center.y - this.pos.y) / sceneOpts.mPerPx
        );
    }

    isVisible() { return this.#isVisible; }
    isDestroyed() { return this.#isDestroyed; }
    destroy() { this.#isDestroyed = true; }
    getCollidedBodies() { return this.#collidedBodies; }

    // Static methods
    
    // Combine two Body objects into one
    static merge(...bodiesArr: Body[]): Body {
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

        for (let i = 0; i < bodies.size; ++i) {
            const body = bodies[i];
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
        const formatComp = (c: number) => (~~c).toString(16).padStart(2, "0");
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
};