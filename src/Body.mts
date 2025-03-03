import { SceneOpts } from "./Scene.mjs";

export class Body {
    pos: {x: number, y: number}; // Object x-y position, in meters
    mass: number; // Body mass, in KG
    radius: number; // Body radius, in meters

    // Render properties
    #color: string;

    constructor(opts: {pos: {x: number, y: number}, mass: number, radius: number, color?: string}) {
        this.pos = opts.pos;
        this.mass = opts.mass;
        this.radius = opts.radius;
        this.#color = opts?.color ?? "#d01dd9";
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
};