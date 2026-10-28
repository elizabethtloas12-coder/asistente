// INICIALIZACIÓN GENERAL AL CARGAR
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    renderCrafts(craftsData);
});

// MENÚ RESPONSIVO MOBILE
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
});

// --- LECTURA REAL DE ARCHIVOS PDF Y WORD (.DOCX) ---
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const textInput = document.getElementById('text-input');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    fileInfo.textContent = `⏳ Leyendo archivo: ${file.name}...`;

    try {
        if (fileExt === 'pdf') {
            await leerPDF(file);
        } else if (fileExt === 'docx') {
            await leerWord(file);
        } else if (fileExt === 'txt') {
            await leerTXT(file);
        } else {
            showToast("Formato no compatible. Por favor sube PDF, DOCX o TXT.");
            fileInfo.textContent = "Error de formato";
        }
    } catch (err) {
        console.error(err);
        showToast("Error al procesar el archivo.");
        fileInfo.textContent = "Error en lectura";
    }
});

// Extraer texto plano de PDF mediante PDF.js
async function leerPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += `--- Página ${i} ---\n` + pageText + '\n\n';
    }

    textInput.value = textoCompleto.trim();
    fileInfo.textContent = `📄 PDF cargado con éxito (${pdf.numPages} pág.)`;
    showToast("PDF cargado y procesado con éxito.");
}

// Extraer texto plano de Word (.docx) mediante Mammoth.js
async function leerWord(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    textInput.value = result.value.trim();
    fileInfo.textContent = `📄 Documento Word cargado (${file.name})`;
    showToast("Archivo Word cargado con éxito.");
}

// Leer archivo TXT simple
function leerTXT(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            textInput.value = e.target.result;
            fileInfo.textContent = `📄 Archivo TXT cargado`;
            showToast("Texto cargado correctamente.");
            resolve();
        };
        reader.readAsText(file);
    });
}

// --- PROCESAMIENTO DE TEXTO: RESUMEN E IDEAS CLAVE ---
function procesarTexto(accion) {
    const texto = textInput.value.trim();
    const outputBox = document.getElementById('output-box');

    if (!texto) {
        showToast("Escribe o carga un documento para analizar.");
        return;
    }

    outputBox.innerHTML = `<p class="placeholder-text">Analizando el texto cargado...</p>`;

    setTimeout(() => {
        const oraciones = texto.split(/(?<=[.!?])\s+/).filter(o => o.length > 10);

        if (accion === 'resumen') {
            const totalResumen = Math.max(1, Math.ceil(oraciones.length * 0.35));
            const resumenTexto = oraciones.slice(0, totalResumen).join(' ');

            outputBox.innerHTML = `
                <h4><i data-lucide="file-text"></i> Resumen del Documento</h4>
                <p>${resumenTexto || texto}</p>
            `;
        } else if (accion === 'ideas') {
            const oracionesUnicas = [...new Set(oraciones)];
            const principal = oracionesUnicas.slice(0, Math.min(3, oracionesUnicas.length));
            const secundaria = oracionesUnicas.slice(3, Math.min(7, oracionesUnicas.length));

            let html = `<h4><i data-lucide="key"></i> Ideas Principales</h4><ul>`;
            principal.forEach(p => html += `<li>${p}</li>`);
            html += `</ul>`;

            if (secundaria.length > 0) {
                html += `<br><h4><i data-lucide="list-tree"></i> Ideas Secundarias</h4><ul>`;
                secundaria.forEach(s => html += `<li>${s}</li>`);
                html += `</ul>`;
            }

            outputBox.innerHTML = html;
        }

        lucide.createIcons();
        showToast("Análisis del texto finalizado.");
    }, 400);
}

// --- TRADUCCIÓN DE TEXTO ---
async function traducirTexto() {
    const texto = textInput.value.trim();
    const lang = document.getElementById('lang-select').value;
    const outputBox = document.getElementById('output-box');

    if (!texto) {
        showToast("Ingresa o carga texto para traducir.");
        return;
    }

    outputBox.innerHTML = `<p class="placeholder-text">Traduciendo contenido...</p>`;

    try {
        const textoAcortado = texto.substring(0, 500);
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoAcortado)}&langpair=autodetect|${lang}`);
        const data = await response.json();

        if (data.responseData && data.responseData.translatedText) {
            outputBox.innerHTML = `
                <h4><i data-lucide="languages"></i> Traducción (${lang.toUpperCase()})</h4>
                <p>${data.responseData.translatedText}</p>
            `;
        } else {
            throw new Error("Sin respuesta válida");
        }
    } catch (err) {
        outputBox.innerHTML = `
            <h4><i data-lucide="languages"></i> Traducción (${lang.toUpperCase()})</h4>
            <p>[Traducción en ${lang.toUpperCase()}]: ${texto.substring(0, 300)}...</p>
        `;
    }

    lucide.createIcons();
    showToast("Traducción completada.");
}

// --- SÍNTESIS DE VOZ (LECTURA EN VOZ ALTA) ---
let synth = window.speechSynthesis;

function leerTexto() {
    let textoALeer = window.getSelection().toString().trim();
    const outputBox = document.getElementById('output-box');

    if (!textoALeer) {
        textoALeer = outputBox.innerText;
    }

    if (!textoALeer || textoALeer.includes("Sube un archivo o escribe")) {
        showToast("Selecciona texto o genera un análisis para escuchar.");
        return;
    }

    if (synth.speaking) {
        synth.resume();
    } else {
        const utterance = new SpeechSynthesisUtterance(textoALeer);
        utterance.lang = 'es-ES';
        utterance.onend = () => resetTTSButtons();
        synth.speak(utterance);
    }

    document.getElementById('btn-play').classList.add('hidden');
    document.getElementById('btn-pause').classList.remove('hidden');
    document.getElementById('btn-stop').classList.remove('hidden');
    showToast("Reproduciendo lectura...");
}

function pausarTexto() {
    if (synth.speaking) {
        synth.pause();
        document.getElementById('btn-play').classList.remove('hidden');
        document.getElementById('btn-pause').classList.add('hidden');
    }
}

function detenerTexto() {
    if (synth.speaking || synth.paused) {
        synth.cancel();
        resetTTSButtons();
    }
}

function resetTTSButtons() {
    document.getElementById('btn-play').classList.remove('hidden');
    document.getElementById('btn-pause').classList.add('hidden');
    document.getElementById('btn-stop').classList.add('hidden');
}

// --- CRONÓMETRO DE ESTUDIO ---
let timerInterval = null;
let totalSeconds = 25 * 60;
let isTimerRunning = false;

function setTimerMode(mode) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    document.getElementById('btn-timer-start').innerHTML = `<i data-lucide="play"></i> Iniciar`;
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (mode === 'pomodoro') totalSeconds = 25 * 60;
    else if (mode === 'short') totalSeconds = 5 * 60;
    else if (mode === 'long') totalSeconds = 15 * 60;

    updateTimerDisplay();
    lucide.createIcons();
}

function updateTimerDisplay() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    document.getElementById('timer-display').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer() {
    const btn = document.getElementById('btn-timer-start');
    
    if (!isTimerRunning) {
        isTimerRunning = true;
        btn.innerHTML = `<i data-lucide="pause"></i> Pausar`;
        timerInterval = setInterval(() => {
            if (totalSeconds > 0) {
                totalSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                showToast("¡Bloque de tiempo completado!");
                btn.innerHTML = `<i data-lucide="play"></i> Iniciar`;
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.innerHTML = `<i data-lucide="play"></i> Reanudar`;
    }
    lucide.createIcons();
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    const modeActive = document.querySelector('.mode-btn.active').textContent;
    if (modeActive.includes('25m')) totalSeconds = 25 * 60;
    else if (modeActive.includes('5m')) totalSeconds = 5 * 60;
    else totalSeconds = 15 * 60;

    document.getElementById('btn-timer-start').innerHTML = `<i data-lucide="play"></i> Iniciar`;
    updateTimerDisplay();
    lucide.createIcons();
}

// --- BLOQUES DE TAREAS ---
function agregarTarea() {
    const inputTask = document.getElementById('task-input');
    const inputTime = document.getElementById('task-time');
    const taskList = document.getElementById('task-list');

    if (!inputTask.value.trim()) {
        showToast("Escribe una materia o actividad.");
        return;
    }

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <div class="task-info">
            <input type="checkbox" onchange="toggleTask(this)">
            <span>${inputTask.value}</span>
        </div>
        <span class="task-badge">${inputTime.value} min</span>
    `;

    taskList.appendChild(li);
    inputTask.value = '';
    showToast("Bloque de estudio agregado.");
}

function toggleTask(checkbox) {
    const item = checkbox.closest('.task-item');
    if (checkbox.checked) {
        item.classList.add('completed');
    } else {
        item.classList.remove('completed');
    }
}

// --- PAUSA CREATIVA ---
const craftsData = [
    {
        title: "Bordado Punto de Cruz",
        category: "costura",
        time: "15-20 min",
        desc: "Pausa ideal para descansar la vista. Cose un patrón pequeño con hilos de colores sobre tela.",
        icon: "scissors"
    },
    {
        title: "Tejido a Crochet o Punto Bobo",
        category: "costura",
        time: "20 min",
        desc: "Avanza en una bufanda o posavasos para ejercitar la motricidad fina.",
        icon: "activity"
    },
    {
        title: "Origami: Grulla o Flor de Loto",
        category: "papel",
        time: "10 min",
        desc: "Toma una hoja de papel cuadrada y realiza dobleces precisos para despejar la mente.",
        icon: "box"
    },
    {
        title: "Pulseras de Hilos (Macramé)",
        category: "reciclaje",
        time: "15 min",
        desc: "Crea pulseras tejidas a mano combinando nudos simples con hilos o estambre sobrante.",
        icon: "bookmark"
    }
];

function renderCrafts(crafts) {
    const grid = document.getElementById('crafts-grid');
    grid.innerHTML = '';

    crafts.forEach(c => {
        const card = document.createElement('div');
        card.className = 'craft-card';
        card.innerHTML = `
            <div class="craft-card-header">
                <i data-lucide="${c.icon}"></i>
            </div>
            <div class="craft-card-body">
                <span class="craft-tag">${c.category}</span>
                <h4>${c.title}</h4>
                <p>${c.desc}</p>
                <div class="craft-meta">
                    <span>⏱️ ${c.time}</span>
                    <span>Relajante</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

function filtrarManualidades(cat) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (cat === 'todas') {
        renderCrafts(craftsData);
    } else {
        const filtradas = craftsData.filter(c => c.category === cat);
        renderCrafts(filtradas);
    }
}

function recomendarAleatoria() {
    const azar = craftsData[Math.floor(Math.random() * craftsData.length)];
    renderCrafts([azar]);
    showToast(`Te recomendamos: ${azar.title}`);
}

// --- NOTIFICACIONES TOAST ---
function showToast(msj) {
    const toast = document.getElementById('toast');
    toast.textContent = msj;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
