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
    #trackedBody = null;
    // Last sim-tick timestamp
    #lastTickTS;
    // Intervals
    #isRunning = false;
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
        // Initial viewport update
        this.#updateViewport();
        // Bind DOM events
        this.#bindEvents();
    }
    add(body) { this.#bodies.push(body); }
    clear() { while (this.#bodies.length)
        this.#bodies.shift(); }
    // Simulation setters
    setZoom(scale) { this.#sceneOpts.mPerPx = DEFAULT_MPERPX / scale; }
    setTimewarpScale(scale) { this.#timewarpScale = scale; }
    track(body) { this.#trackedBody = body; }
    untrack() { this.#trackedBody = null; }
    #bindEvents() {
        // Bind viewport change events
        $(window).on("resize", () => this.#updateViewport());
        // Pause game on lost focus
        let isPausedOnBlur = false;
        $(window).on("blur", () => {
            if (!this.#isRunning)
                return;
            isPausedOnBlur = true;
            this.stop();
        });
        $(window).on("focus", () => {
            if (!isPausedOnBlur)
                return;
            this.start();
            isPausedOnBlur = false;
        });
        $("body").on("wheel", e => {
            const { deltaY } = e.originalEvent;
            const viewportDelta = deltaY / window.innerHeight;
            this.#sceneOpts.mPerPx *= 1 + viewportDelta;
            this.#sceneOpts.mPerPx = Math.max(DEFAULT_MPERPX, this.#sceneOpts.mPerPx);
        });
        $(window).on("keydown", e => {
            switch (e.code) {
                case "ArrowUp":
                    e.preventDefault();
                    this.#sceneOpts.mPerPx /= 1.25;
                    this.#sceneOpts.mPerPx = Math.max(DEFAULT_MPERPX, this.#sceneOpts.mPerPx);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    this.#sceneOpts.mPerPx *= 1.25;
                    this.#sceneOpts.mPerPx = Math.max(DEFAULT_MPERPX, this.#sceneOpts.mPerPx);
                    break;
                case "KeyP":
                    this[this.#isRunning ? "stop" : "start"]();
                    break;
            }
        });
        // Drag events
        let lastTouch = null;
        $("canvas").on("mousedown", (e) => {
            // Drag by Shift + LMB or MMB
            if (!(e.which === 1 && e.shiftKey) && e.which !== 2)
                return;
            // Intercept coordinates
            lastTouch = new Vector2(e.clientX, e.clientY);
        });
        $("canvas").on("mousemove", (e) => {
            if (lastTouch === null)
                return;
            // Cancel tracking
            if (this.#trackedBody !== null)
                this.untrack();
            // Move canvas
            const offset = new Vector2(lastTouch.x - e.clientX, e.clientY - lastTouch.y);
            offset.scale(this.#sceneOpts.mPerPx);
            this.#sceneOpts.center.add(offset);
            // Record coordinates
            lastTouch = new Vector2(e.clientX, e.clientY);
        });
        $("canvas").on("mouseleave mouseup", () => lastTouch = null);
        // Intercept click events
        $("canvas").on("click", e => {
            if (e.shiftKey)
                return; // Ignore dragging clicks
            // Search all visible bodies
            for (const body of this.#bodies) {
                if (!body.isVisible())
                    return; // Skip off-screen elements
                // Check if click is intercepted by body
                const visibleRadius = body.radius / this.#sceneOpts.mPerPx;
                const { x, y } = body.getDrawnPos(this.#sceneOpts);
                if (Math.hypot(x - e.clientX, y - e.clientY) <= visibleRadius) {
                    // Track this object
                    this.track(body);
                    return;
                }
            }
        });
    }
    #updateViewport() {
        [this.#sceneOpts.width, this.#sceneOpts.height] = adjustViewport(this.#canvas);
        this.#draw(); // Redraw
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
        if (this.#isRunning)
            this.#tickTimeout = setTimeout(() => this.#tick(), this.#tickRate);
    }
    // Draw method
    #draw() {
        // Track a tracked/focused body
        if (this.#trackedBody !== null)
            this.#sceneOpts.center.copyFrom(this.#trackedBody.pos);
        // Clear canvas
        this.#ctx.clearRect(0, 0, this.#sceneOpts.width, this.#sceneOpts.height);
        // Render children
        this.#bodies.forEach(b => b.render(this.#ctx, this.#sceneOpts));
        // Update interval
        if (this.#isRunning)
            this.#drawTimeout = setTimeout(() => this.#draw(), this.#drawRate);
    }
    // Start intervals
    start() {
        if (this.#isRunning)
            return console.warn("Simulation already running.");
        // Initial game tick
        this.#tick();
        this.#tickTimeout = setTimeout(() => this.#tick(), this.#tickRate);
        this.#drawTimeout = setTimeout(() => this.#draw(), this.#drawRate);
        this.#isRunning = true;
    }
    // Stop intervals
    stop() {
        clearTimeout(this.#tickTimeout);
        clearTimeout(this.#drawTimeout);
        this.#lastTickTS = null;
        this.#isRunning = false;
    }
}
;
