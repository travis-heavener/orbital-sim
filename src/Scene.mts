import { Body } from "./Body.mjs";
import { SceneEventHandler } from "./SceneEventHandler.mjs";
import { adjustViewport, formatTimewarp, numberToCommaString } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";

const DEBUG_INTERVAL_MS = 500;

export const DEFAULT_MPERPX = 2e5;
export const MAX_ZOOM = 1e5;

const timewarpIntervals = [
    1, 5, 25, 100, 500, 2500, 1e4,
    5e4, 1e5, 5e5, 1e6, 5e6, 1e7, 5e7,
    1e8, 5e8, 1e9
];

// Enum of timewarp indices
export const TIMEWARPS = {
    TIMEWARP_1X  :  0,  TIMEWARP_5X  :  1, TIMEWARP_25X  :  2,
    TIMEWARP_100X:  3,  TIMEWARP_500X:  4, TIMEWARP_2500X:  5,
    TIMEWARP_1E4X:  6,  TIMEWARP_5E4X:  7, TIMEWARP_1E5X :  8,
    TIMEWARP_5E5X:  9,  TIMEWARP_1E6X: 10, TIMEWARP_5E6X : 11,
    TIMEWARP_1E7X:  12, TIMEWARP_5E7X: 13, TIMEWARP_1E8X : 14,
    TIMEWARP_5E8X:  15, TIMEWARP_1E9X: 16
};

export type SceneOpts = {
    center: Vector2, // Center position, in meters
    width: number, // Canvas dimensions
    height: number // Canvas dimensions
};

export class Scene {
    #canvas: HTMLCanvasElement; // Reference to the HTML canvas element
    #ctx: CanvasRenderingContext2D; // Reference to the canvas 2D rendering context
    #sceneOpts: SceneOpts; // Canvas rendering options
    eventHandler: SceneEventHandler;

    // Simulation settings
    #timewarpIndex: number; // The timewarp index to apply to dt when ticking bodies
    #zoomScale: number; // How far the viewport is zoomed OUT by
    #pauseOnLostFocus = true; // Whether or not to pause the sim when the tab is left

    // Debug stats & window telemetry
    #showDebugStats = false;
    #recordCurrentFPS = false; // When true, logs the current FPS & unsets itself
    #currentFPS: number = null; // Current draws-per-second
    #lastDebugTS = 0; // MS timestamp of last debug poll
    #lastFrameTS: number = null; // MS timestamp of last frame start
    #isRunning = false;

    // Bodies
    bodies: Body[]; // Array of Body objects in simulation
    #trackedBody: Body = null;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");

        this.bodies = [];

        this.#sceneOpts = {
            center: new Vector2(),
            width: 0, height: 0
        };

        // Set initial zoom & timewarp
        this.setZoom(1);
        this.setTimewarpIndex(0);

        // Initial viewport update
        this.updateViewport();

        // Bind DOM events
        this.eventHandler = new SceneEventHandler(this, this.#canvas);
    }

    add(...bodies: Body[]) {
        for (let i = 0; i < bodies.length; ++i) {
            const body = bodies[i];
            this.bodies.push(body); // Append to bodies
            this.#createSidebarElement(body); // Create sidebar element
        }
    }
    clear() { while (this.bodies.length) this.bodies.shift(); }

    // Simulation setters
    track(body: Body) { this.#trackedBody = body; }
    untrack() { this.#trackedBody = null; }

    // Getters
    getSceneOpts() { return this.#sceneOpts; }
    getViewportCenter() { return this.#sceneOpts.center; }
    getTimewarpScale() { return timewarpIntervals[this.#timewarpIndex]; }
    getMPerPX() { return this.#zoomScale * DEFAULT_MPERPX; }
    isRunning() { return this.#isRunning; }
    isTracking() { return this.#trackedBody !== null; }
    doPauseOnLostFocus() { return this.#pauseOnLostFocus; }
    showDebugStats() { return this.#showDebugStats; }

    // Setters
    setViewportCenter(x: number, y: number) { this.#sceneOpts.center.x = x, this.#sceneOpts.center.y = y; }
    timewarpInc() { this.setTimewarpIndex(this.#timewarpIndex + 1); }
    timewarpDec() { this.setTimewarpIndex(this.#timewarpIndex - 1); }
    zoomBy(scale: number) { this.setZoom( this.#zoomScale / scale ); }

    setTimewarpIndex(index: number) {
        this.#timewarpIndex = Math.max(0, Math.min(timewarpIntervals.length-1, index));
        $("#timewarp").text(formatTimewarp(this.getTimewarpScale()));
    }
    setZoom(scale: number) {
        this.#zoomScale = Math.min(MAX_ZOOM, Math.max(1, scale));
        ($("#zoom")[0] as HTMLInputElement).value = "" + Math.floor(this.#zoomScale);
    }

    // Control handlers
    toggleDebugStats() { this.#showDebugStats = !this.#showDebugStats; }
    togglePauseOnLostFocus() { this.#pauseOnLostFocus = !this.#pauseOnLostFocus; }

    updateViewport() {
        [this.#sceneOpts.width, this.#sceneOpts.height] = adjustViewport(this.#canvas);
        this.requestManualRedraw(); // Request redraw
    }

    // Tick method
    #tick(dt: number) {
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
                    newBodies.push( newBody ); // Add new body to bodies
                    this.#createSidebarElement( newBody ); // Create new sidebar element
                }
            }

            // Free destroyed bodies (O(1) swap removal)
            for (let i = 0; i < this.bodies.length; ++i) {
                const body = this.bodies[i];
                if (body.isDestroyed()) {
                    this.bodies[i--] = this.bodies[this.bodies.length-1];
                    this.bodies.pop();
                    $(`#body-${body.id}`).remove(); // Delete sidebar element

                    // Untrack if destroyed
                    if (this.#trackedBody === body) this.untrack();
                }
            }

            // Insert new bodies
            this.bodies.push(...newBodies);
        }
    }

    // Draw method
    #draw(frameStart: number) {
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
        if (!this.#isRunning) this.#draw(performance.now());
    }

    // Start intervals
    start() {
        if (this.#isRunning) return console.warn("Simulation already running.");
        this.#isRunning = true;
        requestAnimationFrame(t => this.#draw(t));
    }

    // Stop intervals
    stop() {
        this.#isRunning = false;
        this.#lastFrameTS = null;
    }

    #createSidebarElement(body: Body) {
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
};