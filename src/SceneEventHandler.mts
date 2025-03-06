import { Body } from "./Body.mjs";
import { MAX_ZOOM, Scene } from "./Scene.mjs";
import { notifyUser } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";

export class SceneEventHandler {
    #scene: Scene;
    #canvas: HTMLCanvasElement;

    // Event properties
    #isPausedOnBlur = false;
    #draggingBy: "LMB" | "MMB" = null;
    #lastTouch: Vector2 = null;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        // Update internal references
        this.#scene = scene;
        this.#canvas = canvas;

        // Bind events
        this.#bindEvents();
    }

    #bindEvents() {
        // Bind viewport change events
        $(window).on("resize", () => this.#scene.updateViewport());

        // Pause game on lost focus
        $(window).on("blur", () => this.#handleWindowBlur());
        $(window).on("focus", () => this.#handleWindowFocus());

        // Zoom on scroll
        $("body").on("wheel", e => this.#handleScroll(e));

        // Key events
        $(window).on("keydown", e => this.#handleKeydown(e));
        $(window).on("keyup", e => this.#handleKeyup(e));

        // Drag events
        $(this.#canvas).on("mousedown", e => this.#handleMouseDown(e));
        $(this.#canvas).on("mousemove", e => this.#handleMouseMove(e));
        $(this.#canvas).on("mouseleave mouseup", () => this.#handleMouseRelease());

        // Intercept click events
        $(this.#canvas).on("click", e => this.#handleLeftClick(e));

        // Update zoom slider max value
        ($("#zoom")[0] as HTMLInputElement).max = "" + MAX_ZOOM;

        // Bind zoom slider events
        $("#zoom").on("input change", e => this.#handleZoomSlider(e));
    }

    #setCursor(cursor: "dragging" | "draggable" | "default") {
        this.#canvas.className = "canvas-" + cursor;
    }

    // Event abstractions

    #handleWindowBlur() {
        if (!this.#scene.isRunning() || !this.#scene.doPauseOnLostFocus()) return;
        this.#isPausedOnBlur = true;
        this.#scene.stop();
    }

    #handleWindowFocus() {
        if (!this.#isPausedOnBlur || !this.#scene.doPauseOnLostFocus()) return;
        this.#isPausedOnBlur = false;
        this.#scene.start();
    }

    #handleScroll(e: JQuery.TriggeredEvent) {
        const { deltaY } = e.originalEvent as WheelEvent;
        const viewportDelta = deltaY / window.innerHeight;
        if (Math.abs(viewportDelta) < 0.002) return; // Ignore small zoom increments

        this.#scene.zoomBy(1 / (1 + viewportDelta)); // Update viewport scaling
        this.#scene.requestManualRedraw(); // Request redraw
    }

    #handleKeydown(e: JQuery.KeyDownEvent) {
        switch (e.code) {
            case "ArrowUp":
                e.preventDefault();
                this.#scene.zoomBy(1.25);
                this.#scene.requestManualRedraw();
                break;
            case "ArrowDown":
                e.preventDefault();
                this.#scene.zoomBy(0.8);
                this.#scene.requestManualRedraw();
                break;
            case "ArrowLeft":
                e.preventDefault();
                this.#scene.timewarpDec();
                break;
            case "ArrowRight":
                e.preventDefault();
                this.#scene.timewarpInc();
                break;
            case "KeyD":
                this.#scene.toggleDebugStats();
                notifyUser("Debug Info " + (this.#scene.showDebugStats() ? "On" : "Off"));
                break;
            case "KeyP":
                if (this.#scene.isRunning()) {
                    this.#scene.stop();
                    notifyUser("Paused");
                } else {
                    this.#scene.start();
                    notifyUser("");
                }
                break;
            case "KeyT":
                this.#scene.togglePauseOnLostFocus();
                notifyUser("Pause on Lost Focus " + (this.#scene.doPauseOnLostFocus() ? "On" : "Off"));
                break;
            default:
                if (e.key === "Shift" && this.#draggingBy === null) {
                    e.preventDefault();
                    this.#setCursor("draggable");
                }
                break;
        }
    }

    #handleKeyup(e: JQuery.KeyUpEvent) {
        if (e.key === "Shift" && this.#draggingBy !== "MMB")
            this.#setCursor("default");
    }

    #handleMouseDown(e: JQuery.MouseDownEvent) {
        // Drag by Shift + LMB or MMB
        if (!(e.which === 1 && e.shiftKey) && e.which !== 2) return;

        // Intercept coordinates
        this.#lastTouch = new Vector2(e.clientX, e.clientY);
        this.#setCursor("dragging"); // Update cursor
        this.#draggingBy = e.which === 1 ? "LMB" : "MMB"; // Update dragging method
    }

    #handleMouseMove(e: JQuery.MouseMoveEvent) {
        if (this.#lastTouch === null) return;

        // Cancel tracking
        if (this.#scene.isTracking()) this.#scene.untrack();

        // Move canvas
        const mPerPx = this.#scene.getMPerPX();
        const dx = (this.#lastTouch.x - e.clientX) * mPerPx;
        const dy = (e.clientY - this.#lastTouch.y) * mPerPx;
        const center = this.#scene.getViewportCenter();
        this.#scene.setViewportCenter( center.x + dx, center.y + dy );

        // Record coordinates
        this.#lastTouch.x = e.clientX, this.#lastTouch.y = e.clientY;
        this.#scene.requestManualRedraw(); // Request redraw
    }

    #handleMouseRelease() {
        this.#lastTouch = this.#draggingBy = null;
        this.#setCursor("default"); // Update cursor
    }

    #handleLeftClick(e: JQuery.ClickEvent) {
        if (e.shiftKey) return; // Ignore dragging clicks

        // Add buffer area around smaller bodies
        const sceneOpts = this.#scene.getSceneOpts();
        const { bodies } = this.#scene;
        const bufferSize = (sceneOpts.width + sceneOpts.height) / 180;

        // Search all visible bodies
        const closestHit: {body: Body, dist: number} = {body: null, dist: Infinity};
        for (let i = 0; i < bodies.length; ++i) {
            if (!bodies[i].isVisible()) continue; // Skip off-screen elements

            // Calculate overlap
            const body = bodies[i];
            const mPerPx = this.#scene.getMPerPX();
            const visibleRadius = body.radius / mPerPx;
            const { x, y } = body.getDrawnPos(sceneOpts, mPerPx);
            const dist = Math.hypot(x - e.clientX, y - e.clientY);

            // Check if click is intercepted by body
            if (dist <= visibleRadius + bufferSize && closestHit.dist > dist)
                closestHit.body = body, closestHit.dist = dist;
        }

        // Track closest hit
        if (closestHit.body !== null) {
            this.#scene.track(closestHit.body);
            this.#scene.requestManualRedraw();
        }
    }

    #handleZoomSlider(e: JQuery.TriggeredEvent) {
        const zoomValue = (e.target as HTMLInputElement).value;
        this.#scene.setZoom(parseFloat(zoomValue));
    }
};