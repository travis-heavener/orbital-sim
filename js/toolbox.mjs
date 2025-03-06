// Adjust canvas size based on viewport
export const adjustViewport = (canvas) => {
    // Update canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    $(canvas).css({ "width": canvas.width, "height": canvas.height });
    return [canvas.width, canvas.height];
};
// Create a v4 UUID (https://stackoverflow.com/a/2117523)
export const uuidv4 = () => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
};
