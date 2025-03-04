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

    // Cached gravitational forces between other bodies
    #forcesCache: ForcesCache;

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
    }

    // Tick method
    tick(bodies: Body[], dt: number) {
        // Calculate force from all other bodies
        const F_net = new Vector2();
        for (const body of bodies) {
            if (body.id === this.id) continue; // Skip this

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

    // Clear forces cache
    clearForcesCache() {
        Object.getOwnPropertyNames(this.#forcesCache)
            .forEach(pair => delete this.#forcesCache[pair]);
    }

    // Cache a force from a Body to prevent duplicate calculations
    cacheForce(bodyID: string, force: Vector2) {
        this.#forcesCache[bodyID] = force;
    }

    getDrawnPos(sceneOpts: SceneOpts): Vector2 {
        return new Vector2(
            sceneOpts.width/2 - (sceneOpts.center.x - this.pos.x) / sceneOpts.mPerPx,
            sceneOpts.height/2 + (sceneOpts.center.y - this.pos.y) / sceneOpts.mPerPx
        );
    }

    isVisible() { return this.#isVisible; }
};