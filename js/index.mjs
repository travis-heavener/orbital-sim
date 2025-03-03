import { adjustViewport } from "./toolbox.mjs";
let canvas, ctx;
$(() => {
    canvas = $("canvas")[0];
    ctx = canvas.getContext("2d");
    // Initial viewport adjustment
    adjustViewport(canvas);
    // Sim init
    init();
    // Bind viewport change events
    $(window).on("resize", () => adjustViewport(canvas));
});
const init = () => {
    // Create bodies
};
