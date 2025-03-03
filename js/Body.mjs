export class Body {
    pos; // Object x-y position, in meters
    mass; // Body mass, in KG
    radius; // Body radius, in meters
    // Render properties
    #color;
    constructor(opts) {
        this.pos = opts.pos;
        this.mass = opts.mass;
        this.radius = opts.radius;
        this.#color = opts?.color ?? "#d01dd9";
    }
    // Render method
    render(ctx) {
        ctx.fillStyle = this.#color;
    }
}
;
