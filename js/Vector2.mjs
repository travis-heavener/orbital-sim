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
    scale(scale) {
        this.x *= scale, this.y *= scale;
        return this;
    }
    div(scale) {
        this.x /= scale, this.y /= scale;
        return this;
    }
    add(x, y) {
        if (x.constructor === Vector2) {
            this.x += x.x, this.y += x.y;
            return this;
        }
        this.x += x, this.y += y;
        return this;
    }
    sub(x, y) {
        if (x.constructor === Vector2) {
            this.x -= x.x, this.y -= x.y;
            return this;
        }
        this.x -= x, this.y -= y;
        return this;
    }
    angle() {
        return Math.atan2(this.y, this.x);
    }
    magnitude() {
        return Math.hypot(this.x, this.y);
    }
    clampMagnitude(maxMag) {
        const mag = this.magnitude();
        if (mag <= maxMag)
            return;
        this.x *= maxMag / mag;
        this.y *= maxMag / mag;
    }
    // Static methods
    // Creates a new Vector2 from a radian angle
    static fromAngle(theta, magnitude) {
        const vec2 = new Vector2(Math.cos(theta), Math.sin(theta));
        if (magnitude)
            vec2.scale(magnitude);
        return vec2;
    }
}
;
