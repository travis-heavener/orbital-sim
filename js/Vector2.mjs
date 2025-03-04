export class Vector2 {
    x;
    y;
    constructor(x, y) {
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
        this.x = x;
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
    scale(scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    }
    add(B) {
        this.x += B.x;
        this.y += B.y;
    }
    copyFrom(A) {
        this.x = A.x;
        this.y = A.y;
    }
    // Static methods
    // Creates a new Vector2 from a radian angle
    static fromAngle(theta, magnitude) {
        const vec2 = new Vector2(Math.cos(theta), Math.sin(theta));
        if (magnitude)
            vec2.scale(magnitude);
        return vec2;
    }
    // Adds two vectors and returns the sum
    static add(A, B) {
        return new Vector2(A.x + B.x, A.y + B.y);
    }
    // Scales a vector and returns the new Vector2
    static scale(A, scalar) {
        return new Vector2(A.x * scalar, A.y * scalar);
    }
    // Flips a vector
    static flip(A) {
        return new Vector2(-A.x, -A.y);
    }
}
;
