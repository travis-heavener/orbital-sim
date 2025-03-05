import { Body } from "./Body.mjs";
import { adjustViewport } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
const DEFAULT_MPERPX = 3e5;
export class Scene {
    #canvas; // Reference to the HTML canvas element
    #ctx; // Reference to the canvas 2D rendering context
    #sceneOpts; // Canvas rendering options
    // Simulation settings
    #timewarpScale = 1; // Timewarp scale
    #pauseOnLostFocus = false;
    #showDebugStats = false;
    #tickRate; // In MS, time between simulation ticks
    #drawRate; // In MS, time between render calls
    #bodies; // Array of Body objects in simulation
    #trackedBody = null;
    // Last sim-tick timestamp
    #lastTickTS;
    // Intervals
    #lastManualRedraw = 0;
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
            // Check for collisions
            const newBodies = [];
            for (const body of this.#bodies) {
                // Merge bodies if collided
                const collidedBodies = body.getCollidedBodies();
                if (!body.isDestroyed() && collidedBodies.length)
                    newBodies.push(Body.merge(body, ...collidedBodies));
            }
            // Free destroyed bodies (O(1) swap removal)
            for (let j = 0; j < this.#bodies.length; ++j) {
                const body = this.#bodies[j];
                if (body.isDestroyed()) {
                    this.#bodies[j] = this.#bodies[this.#bodies.length - 1];
                    this.#bodies.pop();
                    --j;
                    // Untrack if destroyed
                    if (this.#trackedBody === body)
                        this.untrack();
                }
            }
            // Insert new bodies
            this.#bodies.push(...newBodies);
            // Clear each body's ForcesCache
            this.#bodies.forEach(b => b.clearCache());
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
        // Show debug stats
        if (this.#showDebugStats) {
            // TODO
        }
        // Update interval
        if (this.#isRunning)
            this.#drawTimeout = setTimeout(() => this.#draw(), this.#drawRate);
    }
    // Used to manually redraw the canvas in case the simulation is stopped
    #requestManualRedraw() {
        if (!this.#isRunning && Date.now() - this.#lastManualRedraw >= this.#drawRate) {
            this.#lastManualRedraw = Date.now();
            this.#draw();
        }
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
    #bindEvents() {
        // Bind viewport change events
        $(window).on("resize", () => this.#updateViewport());
        // Pause game on lost focus
        let isPausedOnBlur = false;
        $(window).on("blur", () => {
            if (!this.#isRunning || !this.#pauseOnLostFocus)
                return;
            isPausedOnBlur = true;
            this.stop();
        });
        $(window).on("focus", () => {
            if (!isPausedOnBlur || !this.#pauseOnLostFocus)
                return;
            isPausedOnBlur = false;
            this.start();
        });
        $("body").on("wheel", e => {
            const { deltaY } = e.originalEvent;
            const viewportDelta = deltaY / window.innerHeight;
            if (Math.abs(viewportDelta) < 0.002)
                return;
            // Update viewport scaling
            this.#sceneOpts.mPerPx *= 1 + viewportDelta;
            this.#sceneOpts.mPerPx = Math.min(1e10, Math.max(DEFAULT_MPERPX, this.#sceneOpts.mPerPx));
            // Request redraw
            this.#requestManualRedraw();
        });
        // Key events
        $(window).on("keydown", e => {
            switch (e.code) {
                case "ArrowUp":
                    e.preventDefault();
                    this.#sceneOpts.mPerPx = Math.max(DEFAULT_MPERPX, this.#sceneOpts.mPerPx / 1.25);
                    this.#requestManualRedraw();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    this.#sceneOpts.mPerPx = Math.min(1e10, this.#sceneOpts.mPerPx * 1.25);
                    this.#requestManualRedraw();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    this.#timewarpScale = Math.max(1, this.#timewarpScale / 2);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    this.#timewarpScale = Math.min(1e7, this.#timewarpScale * 2);
                    break;
                case "KeyD":
                    this.#showDebugStats = !this.#showDebugStats;
                    break;
                case "KeyP":
                    this[this.#isRunning ? "stop" : "start"]();
                    break;
                case "KeyT":
                    this.#pauseOnLostFocus = !this.#pauseOnLostFocus;
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
            // Request redraw
            this.#requestManualRedraw();
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
}
;
