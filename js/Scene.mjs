import { adjustViewport } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
const DEFAULT_MPERPX = 3e5;
export class Scene {
    #canvas; // Reference to the HTML canvas element
    #ctx; // Reference to the canvas 2D rendering context
    #sceneOpts; // Canvas rendering options
    // Simulation settings
    #timewarpScale = 1; // Timewarp scale
    #tickRate; // In MS, time between simulation ticks
    #drawRate; // In MS, time between render calls
    #bodies; // Array of Body objects in simulation
    // Last sim-tick timestamp
    #lastTickTS;
    // Intervals
    #tickTimeout;
    #drawTimeout;
    constructor(canvas, ticksPerSec, framesPerSec) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");
        this.#tickRate = 1 / ticksPerSec;
        this.#drawRate = 1 / framesPerSec;
        this.#bodies = [];
        this.#sceneOpts = {
            center: new Vector2(),
            mPerPx: DEFAULT_MPERPX,
            width: 0, height: 0
        };
        // Bind viewport change events
        this.#updateViewport();
        $(window).on("resize", () => this.#updateViewport());
    }
    add(body) {
        this.#bodies.push(body);
    }
    // Simulation setters
    setZoom(scale) {
        this.#sceneOpts.mPerPx = DEFAULT_MPERPX / scale;
    }
    setTimewarpScale(scale) {
        this.#timewarpScale = scale;
    }
    #updateViewport() {
        [this.#sceneOpts.width, this.#sceneOpts.height] = adjustViewport(this.#canvas);
    }
    // Tick method
    #tick() {
        // Determine elapsed seconds
        const dt = (this.#lastTickTS ? (Date.now() - this.#lastTickTS) : this.#tickRate) / 1e3;
        const iter = 100;
        const dtScaled = dt * this.#timewarpScale / iter;
        for (let i = 0; i < iter; ++i) {
            // Tick each body
            this.#bodies.forEach(b => b.tick(this.#bodies, dtScaled));
            // Clear each body's ForcesCache
            this.#bodies.forEach(b => b.clearForcesCache());
        }
        // Update timestamp
        this.#lastTickTS = Date.now();
        // Update interval
        this.#tickTimeout = setTimeout(() => this.#tick(), this.#tickRate);
    }
    // Draw method
    #draw() {
        // Clear canvas
        this.#ctx.clearRect(0, 0, this.#sceneOpts.width, this.#sceneOpts.height);
        // Render children
        this.#bodies.forEach(b => b.render(this.#ctx, this.#sceneOpts));
        // Update interval
        this.#drawTimeout = setTimeout(() => this.#draw(), this.#drawRate);
    }
    // Start intervals
    start() {
        // Initial game tick
        this.#tick();
        this.#tickTimeout = setTimeout(() => this.#tick(), this.#tickRate);
        this.#drawTimeout = setTimeout(() => this.#draw(), this.#drawRate);
    }
    // Stop intervals
    stop() {
        clearTimeout(this.#tickTimeout);
        clearTimeout(this.#drawTimeout);
    }
}
;
