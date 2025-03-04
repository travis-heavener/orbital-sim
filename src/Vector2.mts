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

    getMagnitude() {
        return Math.hypot(this.x, this.y);
    }

    normalize() {
        const hypot = this.getMagnitude();
        this.x /= hypot;
        this.y /= hypot;
    }

    flip() {
        this.x *= -1;
        this.y *= -1;
    }

    scale(scale: number): Vector2 {
        this.x *= scale;
        this.y *= scale;
        return this;
    }

    add(B: Vector2) {
        this.x += B.x;
        this.y += B.y;
    }

    copyFrom(A: Vector2) {
        this.x = A.x;
        this.y = A.y;
    }

    // Static methods

    // Creates a new Vector2 from a radian angle
    static fromAngle(theta: number, magnitude?: number): Vector2 {
        const vec2 = new Vector2(Math.cos(theta), Math.sin(theta));
        if (magnitude) vec2.scale(magnitude);
        return vec2;
    }

    // Adds two vectors and returns the sum
    static add(A: Vector2, B: Vector2): Vector2 {
        return new Vector2(A.x + B.x, A.y + B.y);
    }

    // Scales a vector and returns the new Vector2
    static scale(A: Vector2, scalar: number): Vector2 {
        return new Vector2(A.x * scalar, A.y * scalar);
    }

    // Flips a vector
    static flip(A: Vector2): Vector2 {
        return new Vector2(-A.x, -A.y);
    }
};