const imgSelector = 'img',
    container = document.querySelector('.container'),
    color = document.querySelector('.color'),
    colorsListContainer = document.querySelector('.colors'),
    colorsListV = document.querySelector('.colorsList'),
    input = document.getElementById('image_input'),
    menu_btn = document.querySelector('.menu'),
    close_btn = document.querySelector('.close'),
    prefixes = ['webkit'];

menu_btn.onclick = function () {
    colorsListContainer.classList.add('active');
}
close_btn.onclick = function () {
    colorsListContainer.classList.remove('active');
}
input.onchange = function () {
    const source = URL.createObjectURL(input.files[0]);
    let newImage = document.createElement('img');
    newImage.src = source;
    newImage.width = 400;
    if (colorsListV.innerHTML != '' && container.querySelector('img') !== null) {
        colorsListV.innerHTML = '';
        container.querySelector('img').remove();
        container.removeAttribute('style')
    }else{
        colorsListV.insertAdjacentHTML('beforeend', '<span>Aucune couleur</span>')
    }
    try {
        container.appendChild(newImage);
        grade(container, "img");
    } catch (e) {
        color.innerHTML = "Oops une erreur s'est produite pendant la création du gradient merci de réessayer"
    }
}




function grade(container, img_selector, callback) {
    // On crée un objet qui contient les propriétés de la classe
    let obj = {};
    obj.callback = callback || null;
    obj.container = container;
    obj.imageContainer =
        obj.container.querySelector(img_selector) ||
        obj.container.querySelector("img");
    obj.gradientData = [];
    if (!obj.imageContainer || !obj.container) {
        console.log(obj);
        return;
    }
    obj.canvas = document.createElement("canvas");
    obj.ctx = obj.canvas.getContext("2d");
    obj.imageDimensions = { width: 0, height: 0 };
    obj.imageData = [];
    obj.image = new Image();
    obj.image.src = obj.imageContainer.src;
    obj.image.crossOrigin = "anonymous";
    obj.image.onload = () => {
        readImage(obj); // On appelle la fonction readImage avec l'objet en argument
    };

    // On définit les fonctions qui correspondent aux méthodes de la classe
    function readImage(obj) {
        obj.imageDimensions.width = obj.image.width * 0.1;
        obj.imageDimensions.height = obj.image.height * 0.1;
        render(obj); // On appelle la fonction render avec l'objet en argument
    }

    function getImageData(obj) {
        let imageData = obj.ctx.getImageData(
            0,
            0,
            obj.imageDimensions.width,
            obj.imageDimensions.height
        ).data;
        obj.imageData = Array.from(imageData);
    }

    function getChunkedImageData(obj) {
        const perChunk = 4;
        let chunked = obj.imageData.reduce((ar, it, i) => {
            const ix = Math.floor(i / perChunk);
            if (!ar[ix]) {
                ar[ix] = [];
            }
            ar[ix].push(it);
            return ar;
        }, []);
        let filtered = chunked.filter((rgba) => {
            return (
                rgba.slice(0, 3).every((val) => val < 250) &&
                rgba.slice(0, 3).every((val) => val > 0)
            );
        });
        return filtered;
    }

    function getRGBAGradientValues(top) {
        return top
            .map((color, index) => {
                return `rgb(${color.rgba.slice(0, 3).join(",")}) ${index == 0 ? "0%" : index == 1 ? "50%" : "100%"
                    }`;
            })
            .join(",");
    }

    function getCSSGradientProperty(top) {
        const val = getRGBAGradientValues(top);
        return prefixes
            .map((prefix) => {
                return `background-image: -${prefix}-linear-gradient(0deg,${val} )`;
            })
            .concat([`background-image: linear-gradient(0deg, ${val})`])
            .join(";");
    }

    function getMiddleRGB(start, end) {
        let w = (0.5 * (2 - start[3])) / (2 - start[3] - end[3]);
        let w1 = (w + start[3]) / (start[3] + end[3]);
        let w2 = (end[3] - w) / (start[3] + end[3]);
        let rgb = [
            parseInt(start[0] * w1 + end[0] * w2),
            parseInt(start[1] * w1 + end[1] * w2),
            parseInt(start[2] * w1 + end[2] * w2),
        ];
        return rgb;
    }

    function getSortedValues(uniq) {
        const occurs = Object.keys(uniq).map((key) => {
            const rgbaKey = key;
            let components = key.split("|"),
                brightness =
                    ((components[0] * 299) + (components[1] * 587) + (components[2] * 114)) /
                    1000;
            return { rgba: rgbaKey.split("|"), occurs: uniq[key], brightness };
        })
            .sort((a, b) => a.occurs - b.occurs)
            .reverse()
            .slice(0, 10);
            
        // On crée un objet ou un tableau qui contient les couleurs
        let colors = [];
        for (let i = 0; i < occurs.length; i++) {
            // On ajoute chaque couleur avec son nom et sa fréquence
            colors.push({
                name: `rgb(${occurs[i].rgba.slice(0, 3).join(",")})`,
                frequency: occurs[i].occurs,
            });
        }
        obj.colorsList = colors;
        for (let i = 0; i < obj.colorsList.length; i++) {
            const color = obj.colorsList[i];
            const colorElement = `
            <div class="rgb">
                <span>couleur ${i + 1 }</span>
                <input type="text" value="${color.name}" style="--input: ${color.name};">
            </div>
            `
            colorsListV.insertAdjacentHTML('beforeend', colorElement);
        }
        return occurs.sort((a, b) => a.brightness - b.brightness).reverse();
    }

    function getTextProperty(top) {
        let rgb = getMiddleRGB(top[0].rgba.slice(0, 3), top[1].rgba.slice(0, 3));
        let o =
            Math.round(
                ((parseInt(rgb[0]) * 299) +
                    (parseInt(rgb[1]) * 587) +
                    (parseInt(rgb[2]) * 114)) /
                1000
            );
        if (o > 125) {
            return "color: #000";
        } else {
            return "color: #fff";
        }
    }

    function getTopValues(uniq) {
        let sorted = getSortedValues(uniq);
        return [sorted[0], sorted[1], sorted[sorted.length - 1]];
    }


    function getUniqValues(chunked) {
        return chunked.reduce((accum, current) => {
            let key = current.join("|");
            if (!accum[key]) {
                accum[key] = 1;
                return accum;
            }
            accum[key] = ++accum[key];
            return accum;
        }, {});
    }

    function renderGradient(obj) {
        const ls = window.localStorage;
        const item_name = `grade-${obj.image.getAttribute("src")}`;
        let top = null;
        if (ls && ls.getItem(item_name)) {
            top = JSON.parse(ls.getItem(item_name));
        } else {
            let chunked = getChunkedImageData(obj);
            top = getTopValues(getUniqValues(chunked));
            if (ls) {
                ls.setItem(item_name, JSON.stringify(top));
            }
        }
        if (obj.callback) {
            obj.gradientData = top;
            return;
        }
        let gradientProperty = getCSSGradientProperty(top);
        let textProperty = getTextProperty(top);
        let style = `${obj.container.getAttribute("style") || ""}; ${gradientProperty}; ${textProperty}`;
        obj.container.setAttribute("style", style);
    }

    function render(obj) {
        obj.canvas.width = obj.imageDimensions.width;
        obj.canvas.height = obj.imageDimensions.height;
        obj.ctx.drawImage(
            obj.image,
            0,
            0,
            obj.imageDimensions.width,
            obj.imageDimensions.height
        );
        getImageData(obj);
        renderGradient(obj);
    }

    // On retourne l'objet
    return obj;
}
