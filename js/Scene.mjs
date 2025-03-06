import { Body } from "./Body.mjs";
import { SceneEventHandler } from "./SceneEventHandler.mjs";
import { adjustViewport } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
const DEBUG_INTERVAL_MS = 500;
const DEFAULT_MPERPX = 2e5;
const MAX_TIMEWARP = 1e10;
const MAX_ZOOM = 1e5;
export class Scene {
    #canvas; // Reference to the HTML canvas element
    #ctx; // Reference to the canvas 2D rendering context
    #sceneOpts; // Canvas rendering options
    eventHandler;
    // Simulation settings
    #timewarpScale = 1; // Timewarp scale applied to dt when ticking bodies
    #zoomScale = 1; // How far the viewport is zoomed OUT by
    #pauseOnLostFocus = true; // Whether or not to pause the sim when the tab is left
    // Debug stats & window telemetry
    #showDebugStats = false;
    #recordCurrentFPS = false; // When true, logs the current FPS & unsets itself
    #currentFPS = null; // Current draws-per-second
    #lastDebugTS = 0; // MS timestamp of last debug poll
    #lastFrameTS = null; // MS timestamp of last frame start
    #isRunning = false;
    // Bodies
    bodies; // Array of Body objects in simulation
    #trackedBody = null;
    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");
        this.bodies = [];
        this.#sceneOpts = {
            center: new Vector2(),
            width: 0, height: 0
        };
        // Initial viewport update
        this.updateViewport();
        // Bind DOM events
        this.eventHandler = new SceneEventHandler(this, this.#canvas);
    }
    add(...bodies) { for (const body of bodies)
        this.bodies.push(body); }
    clear() { while (this.bodies.length)
        this.bodies.shift(); }
    // Simulation setters
    track(body) { this.#trackedBody = body; }
    untrack() { this.#trackedBody = null; }
    // Getters
    getSceneOpts() { return this.#sceneOpts; }
    getViewportCenter() { return this.#sceneOpts.center; }
    getTimewarpScale() { return this.#timewarpScale; }
    getMPerPX() { return this.#zoomScale * DEFAULT_MPERPX; }
    isRunning() { return this.#isRunning; }
    isTracking() { return this.#trackedBody !== null; }
    doPauseOnLostFocus() { return this.#pauseOnLostFocus; }
    showDebugStats() { return this.#showDebugStats; }
    // Setters
    setViewportCenter(x, y) { this.#sceneOpts.center.x = x, this.#sceneOpts.center.y = y; }
    setTimewarp(scale) { this.#timewarpScale = Math.min(MAX_TIMEWARP, Math.max(1, scale)); }
    setZoom(scale) { this.#zoomScale = Math.min(MAX_ZOOM, Math.max(1, scale)); }
    timewarpBy(scale) { this.setTimewarp(this.#timewarpScale * scale); }
    zoomBy(scale) { this.setZoom(this.#zoomScale / scale); }
    // Control handlers
    toggleDebugStats() { this.#showDebugStats = !this.#showDebugStats; }
    togglePauseOnLostFocus() { this.#pauseOnLostFocus = !this.#pauseOnLostFocus; }
    updateViewport() {
        [this.#sceneOpts.width, this.#sceneOpts.height] = adjustViewport(this.#canvas);
        this.requestManualRedraw(); // Request redraw
    }
    // Tick method
    #tick(dt) {
        // Handle high-timewarps
        const iter = Math.ceil(this.#timewarpScale / 2e7);
        const dtScaled = dt * this.#timewarpScale / iter;
        for (let _ = 0; _ < iter; _++) {
            // Tick each body
            for (let i = 0; i < this.bodies.length; ++i)
                this.bodies[i].tick(this.bodies, dtScaled);
            // Check for collisions
            const newBodies = [];
            for (let i = 0; i < this.bodies.length; ++i) {
                // Merge bodies if collided
                const collidedBodies = this.bodies[i].getCollidedBodies();
                if (collidedBodies.length && !this.bodies[i].isDestroyed())
                    newBodies.push(Body.merge(this.bodies[i], ...collidedBodies));
            }
            // Free destroyed bodies (O(1) swap removal)
            for (let i = 0; i < this.bodies.length; ++i) {
                const body = this.bodies[i];
                if (body.isDestroyed()) {
                    this.bodies[i--] = this.bodies[this.bodies.length - 1];
                    this.bodies.pop();
                    // Untrack if destroyed
                    if (this.#trackedBody === body)
                        this.untrack();
                }
            }
            // Insert new bodies
            this.bodies.push(...newBodies);
        }
    }
    // Draw method
    #draw(frameStart) {
        // Tick all bodies
        if (this.#lastFrameTS !== null)
            this.#tick((frameStart - this.#lastFrameTS) / 1e3);
        // Track a tracked/focused body
        if (this.#trackedBody !== null) {
            this.#sceneOpts.center.x = this.#trackedBody.pos.x;
            this.#sceneOpts.center.y = this.#trackedBody.pos.y;
        }
        // Clear canvas
        this.#ctx.clearRect(0, 0, this.#sceneOpts.width, this.#sceneOpts.height);
        // Render children
        const mPerPx = this.getMPerPX();
        for (let i = 0; i < this.bodies.length; ++i)
            this.bodies[i].render(this.#ctx, this.#sceneOpts, mPerPx);
        // Show debug stats
        if (this.#showDebugStats) {
            // Calculate TPS/FPS
            let fps = "-";
            if (this.#currentFPS !== null)
                fps = this.#currentFPS.toFixed(1);
            // Display telemetry
            const { height } = this.#sceneOpts;
            const fontSize = ~~(height / 50);
            this.#ctx.fillStyle = "#f0f0f0";
            this.#ctx.font = `bold ${fontSize}px sans-serif`;
            this.#ctx.fillText(`FPS: ${fps}`, height * 0.02, height * 0.03);
            // Update debug TS
            const now = Date.now();
            if (now - this.#lastDebugTS > DEBUG_INTERVAL_MS) {
                this.#recordCurrentFPS = true;
                this.#lastDebugTS = now;
            }
        }
        // Update timestamp
        if (this.#recordCurrentFPS && this.#lastFrameTS !== null) {
            this.#currentFPS = 1e3 / (frameStart - this.#lastFrameTS);
            this.#recordCurrentFPS = false;
        }
        // Update interval
        if (this.#isRunning) {
            this.#lastFrameTS = frameStart; // Update last frame start TS
            requestAnimationFrame(t => this.#draw(t));
        }
    }
    // Used to manually redraw the canvas in case the simulation is stopped
    requestManualRedraw() {
        if (!this.#isRunning)
            this.#draw(performance.now());
    }
    // Start intervals
    start() {
        if (this.#isRunning)
            return console.warn("Simulation already running.");
        this.#isRunning = true;
        requestAnimationFrame(t => this.#draw(t));
    }
    // Stop intervals
    stop() {
        this.#isRunning = false;
        this.#lastFrameTS = null;
    }
}
;
