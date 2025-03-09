import { MAX_ZOOM } from "./Scene.mjs";
import { notifyUser } from "./toolbox.mjs";
import { Vector2 } from "./Vector2.mjs";
export class SceneEventHandler {
    #scene;
    #canvas;
    // Event properties
    #isPausedOnBlur = false;
    #draggingBy = null;
    #lastTouch = null;
    #pinchStartDist = null; // Distance between both touch positions for pinch zoom
    #pinchStartZoom; // Initial zoom when pinch was started
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
        $(window).on("blur", () => this.#handleWindowBlur());
        $(window).on("focus", () => this.#handleWindowFocus());
        // Zoom on scroll
        $(this.#canvas).on("wheel", e => this.#handleScroll(e));
        // Key events
        $(window).on("keydown", e => this.#handleKeydown(e));
        $(window).on("keyup", e => this.#handleKeyup(e));
        // Drag events
        $(this.#canvas).on("mousedown", e => this.#handleMouseDown(e));
        $(this.#canvas).on("mousemove", e => this.#handleMouseMove(e));
        $(this.#canvas).on("mouseleave mouseup", () => this.#handleMouseRelease());
        // Touch events
        $(this.#canvas).on("touchstart", e => this.#handleTouchStart(e));
        $(this.#canvas).on("touchmove", e => this.#handleTouchMove(e));
        $(this.#canvas).on("touchend touchcancel", (e) => this.#handleTouchEnd(e));
        // Intercept click events
        $(this.#canvas).on("click", e => this.#handleLeftClick(e));
        // Update zoom slider max value
        const zoomInput = $("#zoom")[0];
        zoomInput.max = "" + Math.log2(MAX_ZOOM);
        zoomInput.step = "" + Math.log2(MAX_ZOOM) / 100;
        // Bind zoom slider events
        $(zoomInput).on("input change", e => this.#handleZoomSlider(e));
    }
    #setCursor(cursor) {
        this.#canvas.className = "canvas-" + cursor;
    }
    // Event abstractions
    #handleWindowBlur() {
        if (!this.#scene.isRunning() || !this.#scene.doPauseOnLostFocus())
            return;
        this.#isPausedOnBlur = true;
        this.#scene.stop();
    }
    #handleWindowFocus() {
        if (!this.#isPausedOnBlur || !this.#scene.doPauseOnLostFocus())
            return;
        this.#isPausedOnBlur = false;
        this.#scene.start();
    }
    #handleScroll(e) {
        const { deltaY } = e.originalEvent;
        const viewportDelta = deltaY / window.innerHeight;
        if (Math.abs(viewportDelta) < 0.002)
            return; // Ignore small zoom increments
        this.#scene.zoomBy(1 / (1 + viewportDelta)); // Update viewport scaling
        this.#scene.requestManualRedraw(); // Request redraw
    }
    #handleKeydown(e) {
        // Ignore shift/ctrl/alt/meta modifiers unless explicitly shift
        if ((e.key !== "Shift" && e.shiftKey) || e.ctrlKey || e.altKey || e.metaKey)
            return;
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
                }
                else {
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
    #handleKeyup(e) {
        if (e.key === "Shift" && this.#draggingBy !== "MMB")
            this.#setCursor("default");
    }
    #handleMouseDown(e) {
        // Drag by Shift + LMB or MMB
        if (e.originalEvent.constructor !== TouchEvent && !(e.which === 1 && e.shiftKey) && e.which !== 2)
            return;
        // Intercept coordinates
        const clientX = e.clientX ?? e.originalEvent.changedTouches[0].clientX;
        const clientY = e.clientY ?? e.originalEvent.changedTouches[0].clientY;
        this.#lastTouch = new Vector2(clientX, clientY);
        this.#setCursor("dragging"); // Update cursor
        this.#draggingBy = e.which === 2 ? "MMB" : "LMB"; // Update dragging method
    }
    #handleMouseMove(e) {
        if (this.#lastTouch === null)
            return;
        // Cancel tracking
        if (this.#scene.isTracking())
            this.#scene.untrack();
        const clientX = e.clientX ?? e.originalEvent.changedTouches[0].clientX;
        const clientY = e.clientY ?? e.originalEvent.changedTouches[0].clientY;
        // Move canvas
        const mPerPx = this.#scene.getMPerPX();
        const dx = (this.#lastTouch.x - clientX) * mPerPx;
        const dy = (clientY - this.#lastTouch.y) * mPerPx;
        const center = this.#scene.getViewportCenter();
        this.#scene.setViewportCenter(center.x + dx, center.y + dy);
        // Record coordinates
        this.#lastTouch.x = clientX, this.#lastTouch.y = clientY;
        this.#scene.requestManualRedraw(); // Request redraw
    }
    #handleMouseRelease() {
        this.#lastTouch = this.#draggingBy = null;
        this.#setCursor("default"); // Update cursor
    }
    #handleLeftClick(e) {
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
    }
    #handleZoomSlider(e) {
        const zoomValue = 2 ** parseFloat(e.target.value);
        this.#scene.setZoom(zoomValue);
    }
    #handleTouchStart(e) {
        // Check for single vs double touch
        const { touches } = e.originalEvent;
        if (this.#lastTouch === null)
            this.#handleMouseDown(e);
        // Unset pinch lock status
        if (touches.length !== 2)
            return;
        // Handle pinch to zoom
        this.#pinchStartDist = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
        this.#pinchStartZoom = this.#scene.getZoomScale();
    }
    #handleTouchMove(e) {
        // Check for single vs double touch
        const { touches } = e.originalEvent;
        if (this.#lastTouch !== null && this.#pinchStartDist === null)
            this.#handleMouseMove(e);
        // Unset pinch lock status
        if (touches.length !== 2) {
            this.#pinchStartDist = this.#pinchStartZoom = null;
            return;
        }
        // Handle pinch to zoom
        const newDist = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
        this.#scene.setZoom(this.#pinchStartZoom / (newDist / this.#pinchStartDist));
    }
    #handleTouchEnd(e) {
        this.#handleMouseRelease();
        // Unset pinch lock status
        if (e.originalEvent.touches.length === 0)
            this.#pinchStartDist = this.#pinchStartZoom = null;
    }
}
;
