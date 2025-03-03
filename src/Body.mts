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
    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.#color;
    }
};