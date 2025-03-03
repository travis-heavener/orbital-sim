// Adjust canvas size based on viewport
export const adjustViewport = (canvas) => {
    // Calculate canvas dimensions
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;
    const size = ~~Math.min(75 * vw, 65 * vh);

    // Update canvas dimensions
    canvas.width = canvas.height = size;
    $(canvas).css({"width": canvas.width, "height": canvas.height});
}