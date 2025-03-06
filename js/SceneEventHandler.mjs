import { Vector2 } from "./Vector2.mjs";
export class SceneEventHandler {
    #scene;
    #canvas;
    constructor(scene, canvas) {
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
        let isPausedOnBlur = false;
        $(window).on("blur", () => {
            if (!this.#scene.isRunning() || !this.#scene.doPauseOnLostFocus())
                return;
            isPausedOnBlur = true;
            this.#scene.stop();
        });
        $(window).on("focus", () => {
            if (!isPausedOnBlur || !this.#scene.doPauseOnLostFocus())
                return;
            isPausedOnBlur = false;
            this.#scene.start();
        });
        $("body").on("wheel", e => {
            const { deltaY } = e.originalEvent;
            const viewportDelta = deltaY / window.innerHeight;
            if (Math.abs(viewportDelta) < 0.002)
                return; // Ignore small zoom increments
            this.#scene.zoomBy(1 / (1 + viewportDelta)); // Update viewport scaling
            this.#scene.requestManualRedraw(); // Request redraw
        });
        // Key events
        let draggingBy = null;
        $(window).on("keydown", e => {
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
                    this.#scene.timewarpBy(0.5);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    this.#scene.timewarpBy(2);
                    break;
                case "KeyD":
                    this.#scene.toggleDebugStats();
                    break;
                case "KeyP":
                    this.#scene.isRunning() ? this.#scene.stop() : this.#scene.start();
                    break;
                case "KeyT":
                    this.#scene.togglePauseOnLostFocus();
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
        $(this.#canvas).on("mousedown", (e) => {
            // Drag by Shift + LMB or MMB
            if (!(e.which === 1 && e.shiftKey) && e.which !== 2)
                return;
            // Intercept coordinates
            lastTouch = new Vector2(e.clientX, e.clientY);
            this.#setCursor("dragging"); // Update cursor
            draggingBy = e.which === 1 ? "LMB" : "MMB"; // Update dragging method
        });
        $(this.#canvas).on("mousemove", (e) => {
            if (lastTouch === null)
                return;
            // Cancel tracking
            if (this.#scene.isTracking())
                this.#scene.untrack();
            // Move canvas
            const mPerPx = this.#scene.getMPerPX();
            const dx = (lastTouch.x - e.clientX) * mPerPx;
            const dy = (e.clientY - lastTouch.y) * mPerPx;
            const center = this.#scene.getViewportCenter();
            this.#scene.setViewportCenter(center.x + dx, center.y + dy);
            // Record coordinates
            lastTouch.x = e.clientX, lastTouch.y = e.clientY;
            this.#scene.requestManualRedraw(); // Request redraw
        });
        $(this.#canvas).on("mouseleave mouseup", () => {
            lastTouch = draggingBy = null;
            this.#setCursor("default"); // Update cursor
        });
        // Intercept click events
        $(this.#canvas).on("click", e => {
            if (e.shiftKey)
                return; // Ignore dragging clicks
            // Add buffer area around smaller bodies
            const sceneOpts = this.#scene.getSceneOpts();
            const { bodies } = this.#scene;
            const bufferSize = (sceneOpts.width + sceneOpts.height) / 180;
            // Search all visible bodies
            const closestHit = { body: null, dist: Infinity };
            for (let i = 0; i < bodies.length; ++i) {
                if (!bodies[i].isVisible())
                    continue; // Skip off-screen elements
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
        });
    }
    #setCursor(cursor) {
        this.#canvas.className = "canvas-" + cursor;
    }
}
;
