import { Body } from "./Body.mjs";
import { SceneEventHandler } from "./SceneEventHandler.mjs";
import { adjustViewport, formatTimewarp } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
const DEBUG_INTERVAL_MS = 500;
const TRACK_ANIM_NUM_FRAMES = 99;
const TRACK_ANIM_DURATION_MS = 495;
export const DEFAULT_MPERPX = 2e5;
export const MAX_ZOOM = 1e5;
const timewarpIntervals = [
    1, 5, 25, 100, 500, 2500, 1e4,
    5e4, 1e5, 5e5, 1e6, 5e6, 1e7, 5e7,
    1e8, 5e8, 1e9
];
// Enum of timewarp indices
export const TIMEWARPS = {
    TIMEWARP_1X: 0, TIMEWARP_5X: 1, TIMEWARP_25X: 2,
    TIMEWARP_100X: 3, TIMEWARP_500X: 4, TIMEWARP_2500X: 5,
    TIMEWARP_1E4X: 6, TIMEWARP_5E4X: 7, TIMEWARP_1E5X: 8,
    TIMEWARP_5E5X: 9, TIMEWARP_1E6X: 10, TIMEWARP_5E6X: 11,
    TIMEWARP_1E7X: 12, TIMEWARP_5E7X: 13, TIMEWARP_1E8X: 14,
    TIMEWARP_5E8X: 15, TIMEWARP_1E9X: 16
};
export class Scene {
    #canvas; // Reference to the HTML canvas element
    #ctx; // Reference to the canvas 2D rendering context
    #sceneOpts; // Canvas rendering options
    eventHandler;
    #animRequestID = null;
    // Simulation settings
    #timewarpIndex; // The timewarp index to apply to dt when ticking bodies
    #zoomScale; // How far the viewport is zoomed OUT by
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
    #trackedBodyTimeout = null; // Holds the timeout ID for animating to track a new body
    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");
        this.reset();
        // Bind DOM events
        this.eventHandler = new SceneEventHandler(this, this.#canvas);
    }
    add(...bodies) {
        for (let i = 0; i < bodies.length; ++i) {
            const body = bodies[i];
            this.bodies.push(body); // Append to bodies
            this.#createSidebarElement(body); // Create sidebar element
        }
    }
    clear() { this.bodies = []; }
    track(body) {
        // Animate to track center
        if (this.#trackedBodyTimeout !== null)
            clearTimeout(this.#trackedBodyTimeout);
        const startPos = this.#sceneOpts.center, startZoom = this.#zoomScale;
        // Calculate zoom-out zoom
        const startRadius = this.#trackedBody === null ? 0 : this.#trackedBody.radius;
        const distM = Math.hypot(startPos.x - body.pos.x, startPos.y - body.pos.y) + body.radius + startRadius;
        const maxDimPx = Math.max(this.#sceneOpts.width, this.#sceneOpts.height);
        const outZoom = 5 * distM / maxDimPx / DEFAULT_MPERPX;
        // Calculate final zoom to fit body
        const targetRadiusPX = (this.#sceneOpts.width + this.#sceneOpts.height) / 20;
        const targetZoom = body.radius / targetRadiusPX / DEFAULT_MPERPX;
        // Start animation
        this.#trackedBody = null;
        this.stop();
        let animPhase = "zoomOut";
        let frameNo = 0;
        const updateCenterTimeout = () => {
            if (frameNo++ === TRACK_ANIM_NUM_FRAMES) { // Check if all frames have been rendered
                this.#trackedBody = body;
                this.setZoom(targetZoom);
                this.start();
                return null;
            }
            else { // Otherwise, interpolate
                // Update anim phase
                if (frameNo === TRACK_ANIM_NUM_FRAMES / 3)
                    animPhase = "move";
                else if (frameNo === 2 * TRACK_ANIM_NUM_FRAMES / 3)
                    animPhase = "zoomIn";
                // Handle animation phase
                let frameStep = 3 * frameNo / TRACK_ANIM_NUM_FRAMES;
                switch (animPhase) {
                    case "zoomOut": // Update zoom
                        this.setZoom(startZoom + (outZoom - startZoom) * frameStep);
                        break;
                    case "move": // Update center
                        --frameStep;
                        this.#sceneOpts.center.x = startPos.x + (body.pos.x - startPos.x) * frameStep;
                        this.#sceneOpts.center.y = startPos.y + (body.pos.y - startPos.y) * frameStep;
                        break;
                    case "zoomIn": // Update zoom
                        frameStep -= 2;
                        this.setZoom(outZoom + (targetZoom - outZoom) * frameStep);
                        break;
                }
                // Request redraw
                this.requestManualRedraw();
                // Return new timeout
                return setTimeout(() => this.#trackedBodyTimeout = updateCenterTimeout(), TRACK_ANIM_DURATION_MS / TRACK_ANIM_NUM_FRAMES);
            }
        };
        this.#trackedBodyTimeout = updateCenterTimeout();
    }
    // Getters
    getSceneOpts() { return this.#sceneOpts; }
    getViewportCenter() { return this.#sceneOpts.center; }
    getTimewarpScale() { return timewarpIntervals[this.#timewarpIndex]; }
    getMPerPX() { return this.#zoomScale * DEFAULT_MPERPX; }
    getZoomScale() { return this.#zoomScale; }
    isRunning() { return this.#isRunning; }
    isTracking() { return this.#trackedBody !== null; }
    doPauseOnLostFocus() { return this.#pauseOnLostFocus; }
    showDebugStats() { return this.#showDebugStats; }
    // Setters
    setViewportCenter(x, y) { this.#sceneOpts.center.x = x, this.#sceneOpts.center.y = y; }
    timewarpInc() { this.setTimewarpIndex(this.#timewarpIndex + 1); }
    timewarpDec() { this.setTimewarpIndex(this.#timewarpIndex - 1); }
    zoomBy(scale) { this.setZoom(this.#zoomScale / scale); }
    untrack() { this.#trackedBody = null; }
    setTimewarpIndex(index) {
        this.#timewarpIndex = Math.max(0, Math.min(timewarpIntervals.length - 1, index));
        $("#timewarp").text(formatTimewarp(this.getTimewarpScale()));
    }
    setZoom(scale) {
        this.#zoomScale = Math.min(MAX_ZOOM, Math.max(1, scale));
        $("#zoom")[0].value = "" + Math.log2(this.#zoomScale);
    }
    // Control handlers
    toggleDebugStats() {
        this.#showDebugStats = !this.#showDebugStats;
        if (!this.#showDebugStats)
            $("#fps").text("");
    }
    togglePauseOnLostFocus() { this.#pauseOnLostFocus = !this.#pauseOnLostFocus; }
    updateViewport() {
        [this.#sceneOpts.width, this.#sceneOpts.height] = adjustViewport(this.#canvas);
        this.requestManualRedraw(); // Request redraw
    }
    // Tick method
    #tick(dt) {
        // Handle high-timewarps
        const timewarpScale = this.getTimewarpScale();
        const iter = Math.ceil(timewarpScale / 1e7);
        const dtScaled = dt * timewarpScale / iter;
        for (let _ = 0; _ < iter; _++) {
            // Tick each body
            for (let i = 0; i < this.bodies.length; ++i)
                this.bodies[i].tick(this.bodies, dtScaled);
            // Check for collisions
            const newBodies = [];
            for (let i = 0; i < this.bodies.length; ++i) {
                // Merge bodies if collided
                const collidedBodies = this.bodies[i].getCollidedBodies();
                if (collidedBodies.length && !this.bodies[i].isDestroyed()) {
                    const newBody = Body.merge(this.bodies[i], ...collidedBodies);
                    newBodies.push(newBody); // Add new body to bodies
                    this.#createSidebarElement(newBody); // Create new sidebar element
                    // Track new body if needed
                    if (this.#trackedBody === null)
                        continue;
                    if (this.bodies[i] === this.#trackedBody) {
                        this.#trackedBody = newBody;
                        continue;
                    }
                    for (let j = 0; j < collidedBodies.length; ++j) {
                        if (collidedBodies[j] === this.#trackedBody) {
                            this.#trackedBody = newBody;
                            break;
                        }
                    }
                }
            }
            // Free destroyed bodies (O(1) swap removal)
            for (let i = 0; i < this.bodies.length; ++i) {
                const body = this.bodies[i];
                if (body.isDestroyed()) {
                    this.bodies[i--] = this.bodies[this.bodies.length - 1];
                    this.bodies.pop();
                    $(`#body-${body.id}`).remove(); // Delete sidebar element
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
        // Render body debug info behind bodies
        const mPerPx = this.getMPerPX();
        if (this.#showDebugStats)
            for (let i = 0; i < this.bodies.length; ++i)
                this.bodies[i].renderDebugInfo(this.#ctx, this.#sceneOpts, mPerPx);
        // Render bodies
        for (let i = 0; i < this.bodies.length; ++i)
            this.bodies[i].render(this.#ctx, this.#sceneOpts, mPerPx);
        // Show debug stats
        if (this.#showDebugStats) {
            const fps = this.#currentFPS?.toFixed(1) ?? "-";
            $("#fps").text(`FPS: ${fps}`);
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
            this.#animRequestID = requestAnimationFrame(t => this.#draw(t));
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
        this.#animRequestID = requestAnimationFrame(t => this.#draw(t));
    }
    // Stop intervals
    stop() {
        this.#isRunning = false;
        this.#lastFrameTS = null;
        // Cancel next draw call
        if (this.#animRequestID !== null)
            cancelAnimationFrame(this.#animRequestID);
        this.#animRequestID = null;
    }
    // Reset scene
    reset() {
        this.stop(); // Stop sim
        this.clear(); // Clear all bodies
        // Reset scene opts
        this.#sceneOpts = {
            center: new Vector2(),
            width: 0, height: 0
        };
        // Reset viweport (clears canvas)
        this.updateViewport();
        // Set initial zoom & timewarp
        this.setZoom(1);
        this.setTimewarpIndex(0);
        // Clear bodies container
        $("#bodies-container").html("");
    }
    #createSidebarElement(body) {
        const wrapper = document.createElement("DIV");
        wrapper.id = "body-" + body.id;
        wrapper.className = "body";
        const title = body.name || body.id;
        $(wrapper).append(`
            <div class="body-icon" style="background: ${body.getColor()}"></div>
            <h2 title="Track ${title}">${title}</h2>
        `);
        $("#bodies-container").append(wrapper);
        // Add onclick functionality
        $(wrapper).on("click", () => this.track(body));
    }
}
;
