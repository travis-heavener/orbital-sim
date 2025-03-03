import { Body } from "./Body.mjs";
import { adjustViewport } from "./toolbox.mjs";

export class Scene {
    #canvas: HTMLCanvasElement; // Reference to the HTML canvas element
    #ctx: CanvasRenderingContext2D; // Reference to the canvas 2D rendering context
    #WIDTH: number; // Canvas dimensions
    #HEIGHT: number; // Canvas dimensions

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

        // Bind viewport change events
        [this.#WIDTH, this.#HEIGHT] = adjustViewport(this.#canvas);
        $(window).on("resize", () => {
            [this.#WIDTH, this.#HEIGHT] = adjustViewport(this.#canvas);
        });
    }

    add(body: Body) {
        this.#bodies.push(body);
    }

    // Tick method
    #tick() {}

    // Draw method
    #draw() {
        this.#ctx.clearRect(0, 0, this.#WIDTH, this.#HEIGHT);

        // Render children
        this.#bodies.forEach(b => b.render(this.#ctx));
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