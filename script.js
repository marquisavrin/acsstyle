document.getElementById('bg-banner').src = CONFIG.bannerFile;
document.getElementById('app-logo').src = CONFIG.logoFile;
document.getElementById('hero-title').textContent = CONFIG.eventName;
document.getElementById('hero-desc').textContent = CONFIG.eventSubtitle;

const themeToggleBtn = document.getElementById('theme-toggle');
const htmlRoot = document.documentElement;
if (CONFIG.forceTheme) {
    htmlRoot.setAttribute('data-theme', CONFIG.forceTheme);
    themeToggleBtn.style.display = 'none';
}

let masterCanvas = new fabric.Canvas('master-canvas', {
    width: CONFIG.canvasSize,
    height: CONFIG.canvasSize,
    preserveObjectStacking: true,
    selection: false,
    allowTouchScrolling: false
});

let userPhotoObj = null;
let rawPhotoDims = { width: 0, height: 0 };
let currentFrameId = CONFIG.frames[0].id;
let isFlipped = false;
let currentRotation = 0;

masterCanvas.on('object:scaling', (e) => {
    document.getElementById('zoom-slider').value = Math.abs(e.target.scaleX);
});

masterCanvas.on('mouse:wheel', function(opt) {
    opt.e.preventDefault();
    opt.e.stopPropagation();
    if (!userPhotoObj) return;
    
    let zoom = Math.abs(userPhotoObj.scaleX) + (opt.e.deltaY < 0 ? 0.05 : -0.05);
    if (zoom < 0.1) zoom = 0.1;
    if (zoom > 3) zoom = 3;
    
    document.getElementById('zoom-slider').value = zoom;
    applyZoom(zoom);
});

const cachedFrames = {};
const carouselTrack = document.getElementById('carousel-track');

CONFIG.frames.forEach((frame, index) => {
    fabric.Image.fromURL(frame.file, function(img) {
        img.scaleToWidth(CONFIG.canvasSize);
        img.set({ selectable: false, evented: false });
        cachedFrames[frame.id] = img;
        
        if (index === 0) {
            masterCanvas.setOverlayImage(img, masterCanvas.renderAll.bind(masterCanvas));
        }
    });

    const thumbBtn = document.createElement('button');
    thumbBtn.className = `thumb-btn ${index === 0 ? 'active' : ''}`;
    thumbBtn.style.setProperty('--faction-color', frame.color || 'var(--primary)');
    
    const thumbAsset = frame.thumb || frame.file;
    thumbBtn.innerHTML = `
        <div class="thumb-img" style="background-image: url('${thumbAsset}')"></div>
        <span class="thumb-label">${frame.title}</span>
    `;
    
    thumbBtn.onclick = () => {
        document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
        thumbBtn.classList.add('active');
        currentFrameId = frame.id;
        if (cachedFrames[frame.id]) {
            masterCanvas.setOverlayImage(cachedFrames[frame.id], masterCanvas.renderAll.bind(masterCanvas));
        }
    };

    carouselTrack.appendChild(thumbBtn);
});

const dropShield = document.getElementById('global-drop-shield');
let dragCounter = 0;

window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropShield.classList.add('active');
});

window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
        dropShield.classList.remove('active');
        dragCounter = 0;
    }
});

window.addEventListener('dragover', (e) => e.preventDefault());

window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropShield.classList.remove('active');
    if (e.dataTransfer.files.length > 0) processImage(e.dataTransfer.files[0]);
});

const imageInput = document.getElementById('image-input');
const emptyPrompt = document.getElementById('canvas-empty-prompt');
const downloadBtn = document.getElementById('download-btn');
const changePhotoBtn = document.getElementById('change-photo-btn');

imageInput.addEventListener('click', (e) => {
    e.target.value = '';
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files[0]) processImage(e.target.files[0]);
});

function processImage(file) {
    if (!CONFIG.allowedMIMEs.includes(file.type)) {
        return alert("Error: Unsupported file format. Use JPG, PNG, or WEBP.");
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const rawImg = new Image();
        rawImg.onerror = () => alert("Error: Image file appears corrupted or unreadable.");
        rawImg.onload = function() {
            let width = rawImg.width;
            let height = rawImg.height;
            rawPhotoDims = { width, height };

            if (width > CONFIG.maxSafeDimension || height > CONFIG.maxSafeDimension) {
                if (width > height) {
                    height = Math.round((height * CONFIG.maxSafeDimension) / width);
                    width = CONFIG.maxSafeDimension;
                } else {
                    width = Math.round((width * CONFIG.maxSafeDimension) / height);
                    height = CONFIG.maxSafeDimension;
                }
                const bufferCanvas = document.createElement('canvas');
                bufferCanvas.width = width;
                bufferCanvas.height = height;
                bufferCanvas.getContext('2d').drawImage(rawImg, 0, 0, width, height);
                mountImage(bufferCanvas.toDataURL('image/jpeg', 0.92), width, height);
            } else {
                mountImage(event.target.result, width, height);
            }
        };
        rawImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function mountImage(src, w, h) {
    rawPhotoDims = { width: w, height: h };
    currentRotation = 0;
    isFlipped = false;
    document.getElementById('zoom-slider').value = 1;

    fabric.Image.fromURL(src, function(img) {
        if (userPhotoObj) masterCanvas.remove(userPhotoObj);
        
        userPhotoObj = img;
        updateCoverGeometry();

        img.set({ 
            originX: 'center', 
            originY: 'center', 
            left: CONFIG.canvasSize / 2, 
            top: CONFIG.canvasSize / 2, 
            cornerColor: '#ffffff', 
            cornerStrokeColor: '#18181b', 
            borderColor: '#ffffff', 
            cornerSize: 8, 
            transparentCorners: false 
        });
        
        masterCanvas.add(img);
        masterCanvas.sendToBack(img);
        masterCanvas.renderAll();

        emptyPrompt.style.display = 'none';
        downloadBtn.removeAttribute('disabled');
        changePhotoBtn.style.visibility = 'visible';
    });
}

function updateCoverGeometry() {
    if (!userPhotoObj) return;

    const isRotatedSideways = (currentRotation % 180 !== 0);
    const activeW = isRotatedSideways ? rawPhotoDims.height : rawPhotoDims.width;
    const activeH = isRotatedSideways ? rawPhotoDims.width : rawPhotoDims.height;

    const baseScale = Math.max(CONFIG.canvasSize / activeW, CONFIG.canvasSize / activeH);
    const userZoom = parseFloat(document.getElementById('zoom-slider').value);

    userPhotoObj.set({
        scaleX: (isFlipped ? -baseScale : baseScale) * userZoom,
        scaleY: baseScale * userZoom,
        angle: currentRotation,
        left: CONFIG.canvasSize / 2,
        top: CONFIG.canvasSize / 2
    });

    masterCanvas.renderAll();
}

function applyZoom(zoomValue) {
    if (!userPhotoObj) return;
    const isRotatedSideways = (currentRotation % 180 !== 0);
    const activeW = isRotatedSideways ? rawPhotoDims.height : rawPhotoDims.width;
    const activeH = isRotatedSideways ? rawPhotoDims.width : rawPhotoDims.height;
    const baseScale = Math.max(CONFIG.canvasSize / activeW, CONFIG.canvasSize / activeH);

    userPhotoObj.scaleX = (isFlipped ? -baseScale : baseScale) * zoomValue;
    userPhotoObj.scaleY = baseScale * zoomValue;
    masterCanvas.renderAll();
}

document.getElementById('zoom-slider').addEventListener('input', (e) => applyZoom(parseFloat(e.target.value)));

document.getElementById('flip-btn').addEventListener('click', () => {
    if (!userPhotoObj) return;
    isFlipped = !isFlipped;
    userPhotoObj.set('scaleX', -userPhotoObj.scaleX);
    masterCanvas.renderAll();
});

document.getElementById('rotate-btn').addEventListener('click', () => {
    if (!userPhotoObj) return;
    currentRotation = (currentRotation + 90) % 360;
    updateCoverGeometry();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if (!userPhotoObj) return;
    currentRotation = 0; 
    isFlipped = false; 
    document.getElementById('zoom-slider').value = 1;
    updateCoverGeometry();
});

downloadBtn.addEventListener('click', () => {
    if (!userPhotoObj) return;
    masterCanvas.discardActiveObject(); 
    masterCanvas.renderAll();
    const link = document.createElement('a');
    link.download = `ACSStyle_${CONFIG.eventName.replace(/\s+/g, '_')}_${currentFrameId.toUpperCase()}.png`;
    link.href = masterCanvas.toDataURL({ 
        format: 'png', 
        multiplier: CONFIG.exportResolution / CONFIG.canvasSize 
    });
    link.click();
});