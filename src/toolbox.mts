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

// Used to comma-separate numbers
export const numberToCommaString = (n: number): string => {
    return n.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

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