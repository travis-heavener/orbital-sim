import { Body } from "./Body.mjs";
import { adjustViewport } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
const DEFAULT_MPERPX = 3e5;
const DEBUG_INTERVAL_MS = 500;
export class Scene {
    #canvas; // Reference to the HTML canvas element
    #ctx; // Reference to the canvas 2D rendering context
    #sceneOpts; // Canvas rendering options
    // Simulation settings
    #timewarpScale = 1; // Timewarp scale
    #pauseOnLostFocus = true;
    #showDebugStats = false;
    #lastDebugTS = 0;
    #_recordTPS = false; // When true, logs the current TPS & unsets itself
    #_recordFPS = false; // When true, logs the current FPS & unsets itself
    #lastTickTS = null; // Last sim-tick timestamp
    #currentTPS = null; // Current ticks-per-second
    #currentFPS = null; // Current draws-per-second
    #tickRateSec; // In MS, time between simulation ticks
    #drawRateSec; // In MS, time between render calls
    #bodies; // Array of Body objects in simulation
    #trackedBody = null;
    // Intervals
    #lastManualRedraw = 0;
    #isRunning = false;
    #tickTimeout;
    #drawTimeout;
    constructor(canvas, ticksPerSec, framesPerSec) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");
        this.#tickRateSec = 1 / ticksPerSec;
        this.#drawRateSec = 1 / framesPerSec;
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
        this.#requestManualRedraw(); // Request redraw
    }
    // Tick method
    #tick() {
        const frameStart = Date.now();
        // Determine elapsed seconds
        const dt = (this.#lastTickTS ? (frameStart - this.#lastTickTS) : this.#tickRateSec) / 1e3;
        const dtScaled = dt * this.#timewarpScale;
        // Tick each body
        for (let i = 0; i < this.#bodies.length; ++i)
            this.#bodies[i].tick(this.#bodies, dtScaled);
        // Check for collisions
        const newBodies = [];
        for (let i = 0; i < this.#bodies.length; ++i) {
            // Merge bodies if collided
            const collidedBodies = this.#bodies[i].getCollidedBodies();
            if (collidedBodies.length && !this.#bodies[i].isDestroyed())
                newBodies.push(Body.merge(this.#bodies[i], ...collidedBodies));
        }
        // Free destroyed bodies (O(1) swap removal)
        for (let i = 0; i < this.#bodies.length; ++i) {
            const body = this.#bodies[i];
            if (body.isDestroyed()) {
                this.#bodies[i--] = this.#bodies[this.#bodies.length - 1];
                this.#bodies.pop();
                // Untrack if destroyed
                if (this.#trackedBody === body)
                    this.untrack();
            }
        }
        // Insert new bodies
        this.#bodies.push(...newBodies);
        // Clear each body's ForcesCache
        for (let i = 0; i < this.#bodies.length; ++i)
            this.#bodies[i].clearCache();
        // Update timestamp
        const now = Date.now();
        const elapsedSec = (now - frameStart) / 1e3;
        this.#lastTickTS = now;
        if (this.#_recordTPS) {
            this.#currentTPS = 1 / elapsedSec;
            this.#_recordTPS = false;
        }
        // Update interval
        if (this.#isRunning)
            this.#tickTimeout = setTimeout(() => this.#tick(), Math.max(0, (this.#tickRateSec - elapsedSec) * 1e3));
    }
    // Draw method
    #draw() {
        const frameStart = Date.now();
        // Track a tracked/focused body
        if (this.#trackedBody !== null)
            this.#sceneOpts.center.assign(this.#trackedBody.pos);
        // Clear canvas
        this.#ctx.clearRect(0, 0, this.#sceneOpts.width, this.#sceneOpts.height);
        // Render children
        for (let i = 0; i < this.#bodies.length; ++i)
            this.#bodies[i].render(this.#ctx, this.#sceneOpts);
        // Show debug stats
        if (this.#showDebugStats) {
            // Calculate TPS/FPS
            let fps = "-", tps = "-";
            if (this.#currentFPS !== null && this.#currentTPS !== null) {
                fps = Math.min(1 / this.#drawRateSec, this.#currentFPS).toFixed(1);
                tps = Math.min(1 / this.#tickRateSec, this.#currentTPS).toFixed(1);
            }
            // Display telemetry
            const { height } = this.#sceneOpts;
            const fontSize = ~~(height / 50);
            this.#ctx.fillStyle = "#f0f0f0";
            this.#ctx.font = `${fontSize}px sans-serif`;
            this.#ctx.fillText(`FPS: ${fps}`, height * 0.02, height * 0.03);
            this.#ctx.fillText(`TPS: ${tps}`, height * 0.02, height * 0.03 + fontSize * 1.25);
            // Update debug TS
            const now = Date.now();
            if (now - this.#lastDebugTS > DEBUG_INTERVAL_MS) {
                this.#_recordFPS = this.#_recordTPS = true;
                this.#lastDebugTS = now;
            }
        }
        // Update timestamp
        const now = Date.now();
        const elapsedSec = (now - frameStart) / 1e3;
        if (this.#_recordFPS) {
            this.#currentFPS = 1 / elapsedSec;
            this.#_recordFPS = false;
        }
        // Update interval
        if (this.#isRunning)
            this.#drawTimeout = setTimeout(() => this.#draw(), Math.max(0, (this.#drawRateSec - elapsedSec) * 1e3));
    }
    // Used to manually redraw the canvas in case the simulation is stopped
    #requestManualRedraw() {
        const now = Date.now();
        if (!this.#isRunning && now - this.#lastManualRedraw >= this.#drawRateSec) {
            // Redraw
            this.#draw();
            this.#lastManualRedraw = now;
        }
    }
    // Start intervals
    start() {
        if (this.#isRunning)
            return console.warn("Simulation already running.");
        // Initial tick
        this.#lastTickTS = Date.now() - this.#tickRateSec;
        this.#tick();
        // Initial render
        this.#draw();
        this.#tickTimeout = setTimeout(() => this.#tick(), this.#tickRateSec);
        this.#drawTimeout = setTimeout(() => this.#draw(), this.#drawRateSec);
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
        let draggingBy = null;
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
                default:
                    if (e.key === "Shift" && draggingBy === null) {
                        e.preventDefault();
                        this.#setCursor("draggable");
                    }
                    break;
            }
        });
        $(window).on("keyup", e => {
            if (e.key === "Shift" && draggingBy !== "MMB")
                this.#setCursor("default");
        });
        // Drag events
        let lastTouch = null;
        $("canvas").on("mousedown", (e) => {
            // Drag by Shift + LMB or MMB
            if (!(e.which === 1 && e.shiftKey) && e.which !== 2)
                return;
            // Intercept coordinates
            lastTouch = new Vector2(e.clientX, e.clientY);
            this.#setCursor("dragging"); // Update cursor
            // Update dragging method
            draggingBy = e.which === 1 ? "LMB" : "MMB";
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
        $("canvas").on("mouseleave mouseup", () => {
            lastTouch = null;
            draggingBy = null;
            this.#setCursor("default"); // Update cursor
        });
        // Intercept click events
        $("canvas").on("click", e => {
            if (e.shiftKey)
                return; // Ignore dragging clicks
            // Add buffer area around smaller bodies
            const bufferSize = (this.#sceneOpts.width + this.#sceneOpts.height) / 180;
            // Search all visible bodies
            const closestHit = { body: null, dist: Infinity };
            for (let i = 0; i < this.#bodies.length; ++i) {
                if (!this.#bodies[i].isVisible())
                    continue; // Skip off-screen elements
                // Calculate overlap
                const body = this.#bodies[i];
                const visibleRadius = body.radius / this.#sceneOpts.mPerPx;
                const { x, y } = body.getDrawnPos(this.#sceneOpts);
                const dist = Math.hypot(x - e.clientX, y - e.clientY);
                // Check if click is intercepted by body
                if (dist <= visibleRadius + bufferSize && closestHit.dist > dist) {
                    closestHit.body = body;
                    closestHit.dist = dist;
                }
            }
            // Track closest hit
            if (closestHit.body !== null)
                this.track(closestHit.body);
        });
    }
    #setCursor(cursor) {
        this.#canvas.className = "canvas-" + cursor;
    }
}
;
