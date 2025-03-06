import { Body } from "./Body.mjs";
import { adjustViewport } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";

const DEFAULT_MPERPX = 3e5;
const DEBUG_INTERVAL_MS = 500;

export type SceneOpts = {
    center: Vector2, // Center position, in 
    mPerPx: number, // Meters per pixel
    width: number, // Canvas dimensions
    height: number // Canvas dimensions
};

export class Scene {
    #canvas: HTMLCanvasElement; // Reference to the HTML canvas element
    #ctx: CanvasRenderingContext2D; // Reference to the canvas 2D rendering context
    #sceneOpts: SceneOpts; // Canvas rendering options

    // Simulation settings
    #timewarpScale = 1; // Timewarp scale
    #pauseOnLostFocus = true;
    #showDebugStats = false;

    #recordCurrentFPS = false; // When true, logs the current FPS & unsets itself
    #currentFPS: number = null; // Current draws-per-second

    #lastDebugTS = 0; // MS timestamp of last debug poll
    #lastFrameTS: number = null; // MS timestamp of last frame start
    #isRunning = false;

    #bodies: Body[]; // Array of Body objects in simulation
    #trackedBody: Body = null;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");

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

    add(body: Body) { this.#bodies.push(body); }
    clear() { while (this.#bodies.length) this.#bodies.shift(); }

    // Simulation setters
    setZoom(scale: number) { this.#sceneOpts.mPerPx = DEFAULT_MPERPX / scale; }
    setTimewarpScale(scale: number) { this.#timewarpScale = scale; }
    track(body: Body) { this.#trackedBody = body; }
    untrack() { this.#trackedBody = null; }

    #updateViewport() {
        [this.#sceneOpts.width, this.#sceneOpts.height] = adjustViewport(this.#canvas);
        this.#requestManualRedraw(); // Request redraw
    }

    // Tick method
    #tick(dt: number) {
        // Tick each body
        const dtScaled = dt * this.#timewarpScale;
        for (let i = 0; i < this.#bodies.length; ++i)
            this.#bodies[i].tick(this.#bodies, dtScaled);

        // Check for collisions
        const newBodies = [];
        for (let i = 0; i < this.#bodies.length; ++i) {
            // Merge bodies if collided
            const collidedBodies = this.#bodies[i].getCollidedBodies();
            if (collidedBodies.length && !this.#bodies[i].isDestroyed())
                newBodies.push( Body.merge(this.#bodies[i], ...collidedBodies) );
        }

        // Free destroyed bodies (O(1) swap removal)
        for (let i = 0; i < this.#bodies.length; ++i) {
            const body = this.#bodies[i];
            if (body.isDestroyed()) {
                this.#bodies[i--] = this.#bodies[this.#bodies.length-1];
                this.#bodies.pop();

                // Untrack if destroyed
                if (this.#trackedBody === body) this.untrack();
            }
        }

        // Insert new bodies
        this.#bodies.push(...newBodies);
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
        for (let i = 0; i < this.#bodies.length; ++i)
            this.#bodies[i].render(this.#ctx, this.#sceneOpts);

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
            this.#ctx.font = `${fontSize}px sans-serif`;
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
    #requestManualRedraw() {
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

    #bindEvents() {
        // Bind viewport change events
        $(window).on("resize", () => this.#updateViewport());

        // Pause game on lost focus
        let isPausedOnBlur = false;
        $(window).on("blur", () => {
            if (!this.#isRunning || !this.#pauseOnLostFocus) return;
            isPausedOnBlur = true;
            this.stop();
        });
        $(window).on("focus", () => {
            if (!isPausedOnBlur || !this.#pauseOnLostFocus) return;
            isPausedOnBlur = false;
            this.start();
        });

        $("body").on("wheel", e => {
            const { deltaY } = e.originalEvent as WheelEvent;
            const viewportDelta = deltaY / window.innerHeight;
            if (Math.abs(viewportDelta) < 0.002) return;

            // Update viewport scaling
            this.#sceneOpts.mPerPx *= 1 + viewportDelta;
            this.#sceneOpts.mPerPx = Math.min(1e10, Math.max(DEFAULT_MPERPX, this.#sceneOpts.mPerPx));

            // Request redraw
            this.#requestManualRedraw();
        });

        // Key events
        let draggingBy: "LMB" | "MMB" = null;
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
                    this[ this.#isRunning ? "stop" : "start" ]();
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
            if (e.key === "Shift" && draggingBy !== "MMB") this.#setCursor("default");
        });

        // Drag events
        let lastTouch: Vector2 = null;
        $("canvas").on("mousedown", (e) => {
            // Drag by Shift + LMB or MMB
            if (!(e.which === 1 && e.shiftKey) && e.which !== 2) return;

            // Intercept coordinates
            lastTouch = new Vector2(e.clientX, e.clientY);
            this.#setCursor("dragging"); // Update cursor

            // Update dragging method
            draggingBy = e.which === 1 ? "LMB" : "MMB";
        });

        $("canvas").on("mousemove", (e) => {
            if (lastTouch === null) return;

            // Cancel tracking
            if (this.#trackedBody !== null) this.untrack();

            // Move canvas
            this.#sceneOpts.center.x += (lastTouch.x - e.clientX) * this.#sceneOpts.mPerPx;
            this.#sceneOpts.center.y += (e.clientY - lastTouch.y) * this.#sceneOpts.mPerPx;

            // Record coordinates
            lastTouch.x = e.clientX, lastTouch.y = e.clientY;

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
            if (e.shiftKey) return; // Ignore dragging clicks

            // Add buffer area around smaller bodies
            const bufferSize = (this.#sceneOpts.width + this.#sceneOpts.height) / 180;

            // Search all visible bodies
            const closestHit: {body: Body, dist: number} = {body: null, dist: Infinity};
            for (let i = 0; i < this.#bodies.length; ++i) {
                if (!this.#bodies[i].isVisible()) continue; // Skip off-screen elements
                
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
            if (closestHit.body !== null) {
                this.track(closestHit.body);
                this.#requestManualRedraw();
            }
        });
    }

    #setCursor(cursor: "dragging" | "draggable" | "default") {
        this.#canvas.className = "canvas-" + cursor;
    }
};