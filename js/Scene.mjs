import { adjustViewport } from "./toolbox.mjs";
export class Scene {
    #canvas; // Reference to the HTML canvas element
    #ctx; // Reference to the canvas 2D rendering context
    #sceneOpts; // Canvas rendering options
    #tickRate; // In MS, time between simulation ticks
    #drawRate; // In MS, time between render calls
    #bodies; // Array of Body objects in simulation
    #tickInterval;
    #drawInterval;
    constructor(canvas, tickRate, drawRate) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");
        this.#tickRate = tickRate;
        this.#drawRate = drawRate;
        this.#bodies = [];
        this.#sceneOpts = {
            center: { x: 0, y: 0 },
            mPerPx: 3e5,
            width: 0, height: 0
        };
        // Bind viewport change events
        this.#updateViewport();
        $(window).on("resize", () => this.#updateViewport());
    }
    #updateViewport() {
        [this.#sceneOpts.width, this.#sceneOpts.height] = adjustViewport(this.#canvas);
    }
    add(body) {
        this.#bodies.push(body);
    }
    // Tick method
    #tick() {
        // Tick each body
        this.#bodies.forEach(b => b.tick(this.#bodies));
        // Clear each body's ForcesCache
        // this.#bodies.forEach(b => b.clearForcesCache());
    }
    // Draw method
    #draw() {
        // Clear canvas
        this.#ctx.clearRect(0, 0, this.#sceneOpts.width, this.#sceneOpts.height);
        // Render children
        this.#bodies.forEach(b => b.render(this.#ctx, this.#sceneOpts));
    }
    start() {
        // Initial game tick
        this.#tick();
        // Start intervals
        this.#tickInterval = setInterval(() => this.#tick(), this.#tickRate);
        this.#drawInterval = setInterval(() => this.#draw(), this.#drawRate);
    }
    stop() {
        // Stop intervals
        clearInterval(this.#tickInterval);
        clearInterval(this.#drawInterval);
    }
}
;
