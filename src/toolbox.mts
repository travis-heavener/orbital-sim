import { Vector2 } from "./Vector2.mjs";

// Adjust canvas size based on viewport
export const adjustViewport = (canvas: HTMLCanvasElement): [number, number] => {
    // Update canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    $(canvas).css({"width": canvas.width, "height": canvas.height});
    return [canvas.width, canvas.height];
};

// Create a v4 UUID (https://stackoverflow.com/a/2117523)
export const uuidv4 = (): string => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
};

// Used to show a prompt to the user
let notifyUserTimeout = null;
export const notifyUser = (msg: string) => {
    // Remove any existing modals
    if (notifyUserTimeout !== null) clearTimeout(notifyUserTimeout);
    $(".notify-div").remove();

    // Ignore empty messages
    if (msg === "") return;

    // Create wrapper
    const div = document.createElement("DIV");
    div.className = "notify-div";

    // Create text
    const h1 = document.createElement("H1");
    h1.innerText = msg;

    // Append to body
    $(div).append(h1);
    $(document.body).append(div);

    // Set timeout
    setTimeout(() => $(div).remove(), 3e3);
};

// Used to format timewarps
const roundTimewarp = (w: number, floor: number) => Math.floor(w / floor * 10) / 10;
export const formatTimewarp = (w: number): string => {
    let prefix: string;
    if (w >= 3.154e7) {
        w = roundTimewarp(w, 3.154e7);
        prefix = "yr";
    } else if (w >= 2.628e6) {
        w = roundTimewarp(w, 2.628e6);
        prefix = "mo";
    } else if (w >= 604800) {
        w = roundTimewarp(w, 604800);
        prefix = "wk";
    } else if (w >= 86400) {
        w = roundTimewarp(w, 86400);
        prefix = "day";
    } else if (w >= 3600) {
        w = roundTimewarp(w, 3600);
        prefix = "hr";
    } else if (w >= 60) {
        w = roundTimewarp(w, 60);
        prefix = "min";
    } else if (w > 1) {
        prefix = "sec"
    } else {
        return "Realtime";
    }

    // Add prefix
    return `${w} ${prefix}${w === 1 ? "" : "s"}/sec`;
};

// Used to plot a vector on the canvas
export const plotVector = (ctx: CanvasRenderingContext2D, pos: Vector2, vec: Vector2, lengthPx: number, color: string) => {
    // Calculate end position
    const strokeWidth = lengthPx * 0.1;
    const theta = vec.angle();
    const end = Vector2.fromAngle(theta, lengthPx).add(pos);

    // Draw main arrow
    strokeLine(ctx, pos, end, strokeWidth, color);

    // Draw arrow ends
    const endLengthPx = lengthPx / 5;
    const lowerTheta = theta - Math.PI / 3.5;
    const upperTheta = theta + Math.PI / 3.5;

    // Draw lower end of arrow
    const arrowStart = new Vector2(end);
    arrowStart.sub(endLengthPx * Math.cos(lowerTheta), endLengthPx * Math.sin(lowerTheta));
    strokeLine(ctx, arrowStart, end, strokeWidth, color);

    // Draw upper end of arrow
    arrowStart.x = end.x, arrowStart.y = end.y;
    arrowStart.sub(endLengthPx * Math.cos(upperTheta), endLengthPx * Math.sin(upperTheta));
    strokeLine(ctx, arrowStart, end, strokeWidth, color);
};

// Used to stroke a line between two points
const strokeLine = (ctx: CanvasRenderingContext2D, from: Vector2, to: Vector2, width: number, color: string) => {
    // Config
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    // Draw path
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
};