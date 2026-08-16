let grid;
let posX = 0;
let posY = 0;
async function main() {
    grid = new Array(100);
    const basic = [await getSvg("Bottom"), await getSvg("Top")];
    for (let x = 0; x < 100; x++) {
        grid[x] = new Array(100);
        for (let y = 0; y < 100; y++) {
            grid[x][y] = await stackSvgs(basic);
        }
    }

    grid[20][1] = await stackSvgs([await getSvg("Bottom"), await getSvg("Cloister"), await getSvg("Top")]);
    await render();
    window.addEventListener('resize', async () => {
        await render();
    });
    window.addEventListener('keydown', async (e) => {
        if (e.key == "ArrowRight") {
            posX += 1;
            await render();
        }
    });
}

// Based on https://gist.github.com/CatherineH/5d923ec585acdb89ab2df34c095a681c
function stackSvgs(inputStrings) {
    let svgMain = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="0,0,100,100">`;
    for (let i = 0; i < inputStrings.length; i++) {
        let domParser = new DOMParser();
        let svgDOM = domParser.parseFromString(inputStrings[i], 'text/xml').getElementsByTagName('svg')[0];
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
        return result;
    } catch (error) {
        console.error(error.message);
    }
}

async function render() {
    const canvas = document.querySelector("#tiles");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = Math.floor(window.innerWidth / 100);
    const height = Math.floor(window.innerHeight / 100);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let img = grid[x + posX][y + posY];
            if (img.complete) {
                ctx.drawImage(img, x * 100, y * 100);
            } else {
                img.addEventListener("load", () => {
                    ctx.drawImage(img, x * 100, y * 100);
                });
            }
        }
    }
    console.log("Renderered");
}
main();