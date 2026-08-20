const fs = require("fs"), path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
let all;

// Based on https://gist.github.com/CatherineH/5d923ec585acdb89ab2df34c095a681c
function stackSvgs(inputStrings, angle = 0) {
    let svgMain = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="0,0,100,100">`;
    for (let i = 0; i < inputStrings.length; i++) {
        let dom = new JSDOM(inputStrings[i], { contentType: "image/svg+xml" });
        let svgDOM = dom.window.document.getElementsByTagName("svg")[0];
        svgMain += svgDOM.innerHTML;
    }
    svgMain += `</svg>`;
    return svgMain;
}

// Based on https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function getSvg(part) {
    let result = await fs.readFileSync(path.join(__dirname, "carcParts/" + part + ".svg"), { encoding: "utf-8" });
    return [result, rotateSvg(result, 90), rotateSvg(result, 180), rotateSvg(result, 270)];
}
function tile(notation) {
    const sections = notation.split("/");
    const sectionsAsigns = ["road", "river", "city", "cloister"];
    const decode = { "A": "all", "C": "corner", "E": "end", "S": "straight", "T": "three" };
    const outs = [all.bottom[0]];
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sa = sectionsAsigns[i];
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
                console.log("INVALID TILE NOTATION!!", section);
                continue;
            }
            if (!["A", "C", "E", "S", "T"].includes(type)) {
                console.log("INVALID TILE NOTATION!!", section);
                continue;
            }
            outs.push(all[sa][decode[type]][angle]);
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
    let doc = new JSDOM(svg, { contentType: "image/svg+xml" });
    doc.window.document.documentElement.children[0].setAttribute("transform", `rotate(${angle})`);
    doc.window.document.documentElement.children[0].setAttribute("transform-origin", `50% 50%`);
    let serializer = new doc.window.XMLSerializer();
    return doc.serialize();
}

async function main() {
    all = await getAllTiles();
    let tiles = JSON.parse(await fs.readFileSync(path.join(__dirname, "tiles.json"), { encoding: "utf8" }));
    for (let i = 0; i < tiles.tiles.length; i++) {
        const tileData = tiles.tiles[i];
        let svg = await tile(tileData);
        fs.writeFileSync(path.join(__dirname, "tiles/" + i + ".svg"), svg);
    }
}
main();