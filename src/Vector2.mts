export class Vector2 {
    x: number;
    y: number;

    constructor(x?: number | Vector2, y?: number) {
        // Default constructor
        if (arguments.length === 0) {
            this.x = this.y = 0;
            return;
        }

        // Copy constructor
        if (x.constructor === Vector2) {
            this.x = x.x;
            this.y = x.y;
            return;
        }

        // Numeric constructor
        this.x = x as number;
        this.y = y;
    }

    scale(scale: number): Vector2 {
        this.x *= scale, this.y *= scale;
        return this;
    }

    div(scale: number): Vector2 {
        this.x /= scale, this.y /= scale;
        return this;
    }

    add(x: Vector2 | number, y?: number) {
        if (x.constructor === Vector2) {
            this.x += x.x, this.y += x.y;
            return;
        }

        this.x += x as number, this.y += y;
    }

    // Static methods

    // Creates a new Vector2 from a radian angle
    static fromAngle(theta: number, magnitude?: number): Vector2 {
        const vec2 = new Vector2(Math.cos(theta), Math.sin(theta));
        if (magnitude) vec2.scale(magnitude);
        return vec2;
    }
};