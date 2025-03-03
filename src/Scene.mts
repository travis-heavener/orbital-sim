import { Body } from "./Body.mjs";

export class Scene {
    tickRate; // In MS, time between simulation ticks
    drawRate; // In MS, time between render calls

    bodies: Body[]; // Array of Body objects in simulation

    constructor(tickRate, drawRate) {
        this.tickRate = tickRate;
        this.drawRate = drawRate;
        this.bodies = [];
    }

    addBody(body: Body) {
        this.bodies.push(body);
    }
};