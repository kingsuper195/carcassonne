let grid;
let posX = 0;
let posY = 0;
let width = 0;
let height = 0;
let highlighted = [-1, -1];
const canvas = document.querySelector("#tiles");
const ctx = canvas.getContext("2d");
let all;

async function main() {
    loading();
    all = await getAllTiles();
    grid = new Array(100);
    console.log("The tiles I got were: ", all);
    const basic = [all.bottom[0], all.top[0]];
    for (let x = 0; x < 100; x++) {
        grid[x] = new Array(100);
        for (let y = 0; y < 100; y++) {
            grid[x][y] = await tile("--/--/--/--");
        }
    }

    grid[99][99] = await tile("--/--/--/.0");
    width = Math.floor(window.innerWidth / 100);
    height = Math.floor(window.innerHeight / 100);
    await render();
    window.addEventListener("resize", async () => {
        width = Math.floor(window.innerWidth / 100);
        height = Math.floor(window.innerHeight / 100);
        if (posX <= 100 - width && posY <= 100 - height) {
            await render();
        } else {
            if (posX > 100 - width) {
                posX = 100 - width;
            }
            if (posY > 100 - height) {
                posY = 100 - height;
            }
        }
    });
    window.addEventListener("keydown", async (e) => {
        if (e.shiftKey) {
            if (highlighted[0] !== -1) {
                if (e.key == "ArrowRight") {
                    if (highlighted[0] < 99) {
                        highlighted[0] += 1;
                        await render();
                    }
                }
                if (e.key == "ArrowLeft") {
                    if (highlighted[0] > 0) {
                        highlighted[0] -= 1;
                        await render();
                    }
                }
                if (e.key == "ArrowDown") {
                    if (highlighted[1] < 99) {
                        highlighted[1] += 1;
                        await render();
                    }
                }
                if (e.key == "ArrowUp") {
                    if (highlighted[1] > 0) {
                        highlighted[1] -= 1;
                        await render();
                    }
                }
            }
        } else {
            if (e.key == "ArrowRight") {
                if (posX < 100 - width) {
                    posX += 1;
                    await render();
                }
            }
            if (e.key == "ArrowLeft") {
                if (posX > 0) {
                    posX -= 1;
                    await render();
                }
            }
            if (e.key == "ArrowDown") {
                if (posY < 100 - height) {
                    posY += 1;
                    await render();
                }
            }
            if (e.key == "ArrowUp") {
                if (posY > 0) {
                    posY -= 1;
                    await render();
                }
            }
        }
        if (e.key == "c") {
            if (highlighted[0] !== -1) {
                grid[highlighted[0]][highlighted[1]] = await tile("--/--/A0/--");
            }
        }
    });
    canvas.addEventListener("mousedown", async (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 100) + posX;
        const y = Math.floor((e.clientY - rect.top) / 100) + posY;
        if (highlighted[0] == x && highlighted[1] == y) {
            highlighted = [-1, -1];
        } else {
            highlighted = [x, y];
        }

        await render();
    });
}

// Based on https://gist.github.com/CatherineH/5d923ec585acdb89ab2df34c095a681c
function stackSvgs(inputStrings, angle = 0) {
    let svgMain = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="0,0,100,100">`;
    for (let i = 0; i < inputStrings.length; i++) {
        let domParser = new DOMParser();
        let svgDOM = domParser.parseFromString(inputStrings[i], "text/xml").getElementsByTagName("svg")[0];
        svgMain += svgDOM.innerHTML;
    }
    svgMain += `</svg>`;
    let svgMainUrl = "data:image/svg+xml," + encodeURIComponent(svgMain);
    let svgMainImage = new Image();
    svgMainImage.src = svgMainUrl;
    return svgMainImage;
}

// Based on https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function getSvg(part) {
    try {
        const response = await fetch("/assets/carcParts/" + part + ".svg");
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.text();
        return [result, rotateSvg(result, 90), rotateSvg(result, 180), rotateSvg(result, 270)];
    } catch (error) {
        console.error(error.message);
    }
}

function tile(notation) {
    const sections = notation.split("/");
    const sectionsAsigns = ["road", "river", "city", "cloister"];
    const decode = { "A": "all", "C": "corner", "E": "end", "S": "straight", "T": "three" };
    const outs = [all.bottom[0]];
    for (let i = 0; i < sections.length; i++) {
        const sectionWhole = sections[i];
        const sa = sectionsAsigns[i];
        const sectionSplit = sectionWhole.split("&");
        for (const section of sectionSplit) {
            if (sa == "cloister") {
                let type = section[0];
                let angleStr = section.substring(1);
                if (type == "-") {
                    continue;
                }
                let angle = +angleStr;
                if (!([0, 1, 2, 3].includes(angle))) {
                    console.log("INVALID TILE NOTATION!!");
                    continue;
                }
                outs.push(all[sa][angle]);
            } else {
                let type = section[0];
                let angleStr = section.substring(1);
                if (type == "-") {
                    continue;
                }
                let angle = +angleStr;
                if (!([0, 1, 2, 3].includes(angle))) {
                    console.log("INVALID TILE NOTATION!!");
                    continue;
                }
                if (!["A", "C", "E", "S", "T"].includes(type)) {
                    console.log("INVALID TILE NOTATION!!");
                    continue;
                }
                outs.push(all[sa][decode[type]][angle]);
            }
        }
    }
    outs.push(all.top[0]);
    return stackSvgs(outs);
}

async function getAllTiles() {
    let proc = {
        "road": {
            "TQ": await getSvg("R-TQ")
        },
        "river": {},
        "city": {},
        "cloister": await getSvg("Cloister"),
        "top": await getSvg("Top"),
        "bottom": await getSvg("Bottom")
    };

    let types = { "road": "R", "river": "S", "city": "C" };
    let get = ["End", "Straight", "Corner", "Three", "All"];

    for (const type of Object.keys(types)) {
        const fl = types[type];
        for (const edges of get) {
            proc[type][edges.toLowerCase()] = await getSvg(`${fl}-${edges}`);
        }
    }
    return proc;
}

function rotateSvg(svg, angle) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(svg, "image/svg+xml");
    doc.documentElement.children[0].setAttribute("transform", `rotate(${angle})`);
    doc.documentElement.children[0].setAttribute("transform-origin", `50% 50%`);
    let serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
}

async function render() {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let img = grid[x + posX][y + posY];
            if (img.complete) {
                if (highlighted[0] != x + posX || highlighted[1] != y + posY) {
                    ctx.drawImage(img, x * 100, y * 100);
                }
            } else {
                img.addEventListener("load", () => {
                    if (highlighted[0] != x + posX || highlighted[1] != y + posY) {
                        ctx.drawImage(img, x * 100, y * 100);
                    }
                });
            }
        }
    }
}

async function loading() {
    const canvas = document.querySelector("#tiles");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = `${canvas.width / 8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Creating Grid...", canvas.width / 2, ctx.canvas.height / 2);
}
main();

document.querySelector("#menuButton").addEventListener("click", () => {
    let menu = document.querySelector("#menuExpanded");
    if (window.getComputedStyle(menu).getPropertyValue("display") == "none") {
        menu.style.display = "block";
    } else {
        menu.style.display = "none";
    }
});