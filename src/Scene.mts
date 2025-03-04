import { Body } from "./Body.mjs";
import { adjustViewport } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";

const DEFAULT_MPERPX = 3e5;

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

    #tickRate: number; // In MS, time between simulation ticks
    #drawRate: number; // In MS, time between render calls

    #bodies: Body[]; // Array of Body objects in simulation
    #trackedBody: Body = null;

    // Last sim-tick timestamp
    #lastTickTS: number;

    // Intervals
    #isRunning = false;
    #tickTimeout: number;
    #drawTimeout: number;

    constructor(canvas: HTMLCanvasElement, ticksPerSec: number, framesPerSec: number) {
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

    add(body: Body) { this.#bodies.push(body); }

    // Simulation setters
    setZoom(scale: number) { this.#sceneOpts.mPerPx = DEFAULT_MPERPX / scale; }
    setTimewarpScale(scale: number) { this.#timewarpScale = scale; }
    track(body: Body) { this.#trackedBody = body; }
    untrack() { this.#trackedBody = null; }

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
        if (this.#isRunning)
            this.#tickTimeout = setTimeout(() => this.#tick(), this.#tickRate);
    }

    // Draw method
    #draw() {
        // Track a tracked/focused body
        if (this.#trackedBody !== null)
            this.#sceneOpts.center = this.#trackedBody.pos;

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
        if (this.#isRunning) return console.warn("Simulation already running.");

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
};