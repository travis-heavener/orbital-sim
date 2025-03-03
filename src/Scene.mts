import { Body } from "./Body.mjs";
import { adjustViewport } from "./toolbox.mjs";

export type SceneOpts = {
    center: {x: number, y: number}, // Center position
    mPerPx: number, // Meters per pixel
    width: number, // Canvas dimensions
    height: number // Canvas dimensions
};

export class Scene {
    #canvas: HTMLCanvasElement; // Reference to the HTML canvas element
    #ctx: CanvasRenderingContext2D; // Reference to the canvas 2D rendering context
    #sceneOpts: SceneOpts; // Canvas rendering options

    #tickRate: number; // In MS, time between simulation ticks
    #drawRate: number; // In MS, time between render calls

    #bodies: Body[]; // Array of Body objects in simulation

    #tickInterval: number;
    #drawInterval: number;

    constructor(canvas: HTMLCanvasElement, tickRate: number, drawRate: number) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");

        this.#tickRate = tickRate;
        this.#drawRate = drawRate;
        this.#bodies = [];

        this.#sceneOpts = {
            center: {x: 0, y: 0},
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

    add(body: Body) {
        this.#bodies.push(body);
    }

    // Tick method
    #tick() {}

    // Draw method
    #draw() {
        // Clear canvas
        this.#ctx.clearRect(0, 0, this.#sceneOpts.width, this.#sceneOpts.height);

        // Render children
        this.#bodies.forEach(b => b.render(this.#ctx, this.#sceneOpts));
    }

    start() {
        // Start intervals
        this.#tickInterval = setInterval(() => this.#tick(), this.#tickRate);
        this.#drawInterval = setInterval(() => this.#draw(), this.#drawRate);
    }

    stop() {
        // Stop intervals
        clearInterval(this.#tickInterval);
        clearInterval(this.#drawInterval);
    }
};