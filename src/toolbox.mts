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