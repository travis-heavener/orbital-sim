export class Body {
    mass; // Body mass, in KG
    radius; // Body radius, in meters

    // Render properties
    #color;

    constructor(mass, radius) {
        this.mass = mass;
        this.radius = radius;
    }

    // Private setters
    setColor(color: string): Body {
        this.#color = color;
        return this;
    }

    // Render method
    render(ctx) {
        ctx.fillStyle = this.#color;
    }
};