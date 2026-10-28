// INICIALIZAR ICONOS DE LUCIDE
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    renderCrafts(craftsData);
});

// MENÚ HAMBURGUESA MOBILE
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// CERRAR MENÚ AL HACER CLIC EN UN ENLACE
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// --- FUNCIONALIDAD DE CARGA DE ARCHIVOS ---
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const textInput = document.getElementById('text-input');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileInfo.textContent = `📄 Archivo cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        showToast(`Archivo "${file.name}" listo para ser analizado.`);
        
        // Simulación de lectura de texto según el tipo de archivo
        const reader = new FileReader();
        reader.onload = function(evt) {
            textInput.value = `[Texto extraído del archivo: ${file.name}]\n\n` + 
                (evt.target.result || "Contenido de muestra procesado correctamente desde el documento seleccionado. Puedes proceder a resumir o extraer ideas clave.");
        };
        reader.readAsText(file);
    }
});

// --- ASISTENTE DE TEXTO: RESUMEN E IDEAS CLAVE ---
function analizarTexto(tipo) {
    const text = textInput.value.trim();
    const outputBox = document.getElementById('output-box');

    if (!text) {
        showToast("Por favor, ingresa o pega un texto para analizar.");
        return;
    }

    outputBox.innerHTML = `<p class="placeholder-text">Procesando información...</p>`;

    setTimeout(() => {
        if (tipo === 'resumen') {
            outputBox.innerHTML = `
                <h4><i data-lucide="file-text"></i> Resumen Ejecutivo</h4>
                <p>El texto analiza aspectos fundamentales sobre el tema presentado. En síntesis, se destacan los conceptos centrales, organizando el contenido principal de forma estructurada para facilitar una comprensión rápida y efectiva de las guías académicas.</p>
            `;
        } else if (tipo === 'ideas') {
            outputBox.innerHTML = `
                <h4><i data-lucide="key"></i> Ideas Principales</h4>
                <ul>
                    <li>Concepto principal enfocado en el desarrollo temático de la lectura.</li>
                    <li>Planteamiento central del problema o hipótesis discutida en el documento.</li>
                </ul>
                <br>
                <h4><i data-lucide="list-tree"></i> Ideas Secundarias</h4>
                <ul>
                    <li>Argumentos de soporte y datos complementarios explicados en el texto.</li>
                    <li>Ejemplos ilustrativos y referencias secundarias abordadas.</li>
                </ul>
            `;
        }
        lucide.createIcons();
        showToast("Análisis completado exitosamente.");
    }, 600);
}

// --- TRADUCTOR MULTI-IDIOMA ---
function traducirTexto() {
    const text = textInput.value.trim();
    const lang = document.getElementById('lang-select').value;
    const outputBox = document.getElementById('output-box');

    if (!text) {
        showToast("Ingresa texto antes de traducir.");
        return;
    }

    outputBox.innerHTML = `<p class="placeholder-text">Traduciendo texto...</p>`;

    setTimeout(() => {
        outputBox.innerHTML = `
            <h4><i data-lucide="languages"></i> Traducción (${lang.toUpperCase()})</h4>
            <p>[Traducción Simulada en ${lang.toUpperCase()}]: ${text.substring(0, 300)}...</p>
        `;
        lucide.createIcons();
        showToast("Traducción generada.");
    }, 600);
}

// --- SÍNTESIS DE VOZ (LECTOR EN VOZ ALTA) ---
let synth = window.speechSynthesis;
let utterance = null;

function leerTexto() {
    const outputBox = document.getElementById('output-box');
    const textToRead = outputBox.innerText;

    if (!textToRead || textToRead.includes("Los resultados de tu resumen")) {
        showToast("No hay información analizada para leer.");
        return;
    }

    if (synth.speaking) {
        synth.resume();
    } else {
        utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'es-ES';
        utterance.onend = () => resetTTSButtons();
        synth.speak(utterance);
    }

    document.getElementById('btn-play').classList.add('hidden');
    document.getElementById('btn-pause').classList.remove('hidden');
    document.getElementById('btn-stop').classList.remove('hidden');
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

// --- ORGANIZADOR DE TIEMPO / TEMPORIZADOR POMODORO ---
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
                showToast("¡Tiempo completado! Tómate un descanso.");
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
    const activeMode = document.querySelector('.mode-btn.active').textContent;
    if (activeMode.includes('25m')) totalSeconds = 25 * 60;
    else if (activeMode.includes('5m')) totalSeconds = 5 * 60;
    else totalSeconds = 15 * 60;
    
    document.getElementById('btn-timer-start').innerHTML = `<i data-lucide="play"></i> Iniciar`;
    updateTimerDisplay();
    lucide.createIcons();
}

// --- GESTOR DE BLOQUES DE TAREAS ---
function agregarTarea() {
    const taskInput = document.getElementById('task-input');
    const timeInput = document.getElementById('task-time');
    const taskList = document.getElementById('task-list');

    if (!taskInput.value.trim()) {
        showToast("Ingresa una descripción para la tarea.");
        return;
    }

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <div class="task-info">
            <input type="checkbox" onchange="toggleTask(this)">
            <span>${taskInput.value}</span>
        </div>
        <span class="task-badge">${timeInput.value} min</span>
    `;

    taskList.appendChild(li);
    taskInput.value = '';
    showToast("Bloque de estudio añadido.");
}

function toggleTask(checkbox) {
    const item = checkbox.closest('.task-item');
    if (checkbox.checked) {
        item.classList.add('completed');
    } else {
        item.classList.remove('completed');
    }
}

// --- DATOS DE MANUALIDADES Y PAUSA CREATIVA ---
const craftsData = [
    {
        title: "Bufanda en Punto Bobo",
        category: "costura",
        time: "20-30 min",
        desc: "Ideal para principiantes. Usa agujas gruesas y lana suave para relajar las manos después de escribir.",
        icon: "scissors"
    },
    {
        title: "Grane de Origami Modular",
        category: "papel",
        time: "10 min",
        desc: "Plegado geométrico para ejercitar la concentración espacial y despejar la mente.",
        icon: "box"
    },
    {
        title: "Marcapáginas de Hilos",
        category: "reciclaje",
        time: "15 min",
        desc: "Crea separadores de libros tejiendo restos de hilos con la técnica de macramé.",
        icon: "bookmark"
    },
    {
        title: "Costura de Estuche de Fieltro",
        category: "costura",
        time: "25 min",
        desc: "Corta y cose a mano un práctico estuche para tus lápices y marcadores de estudio.",
        icon: "pen-tool"
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
                    <span>Nivel: Fácil</span>
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
    const randomCraft = craftsData[Math.floor(Math.random() * craftsData.length)];
    renderCrafts([randomCraft]);
    showToast(`Te recomendamos: ${randomCraft.title}`);
}

// --- NOTIFICACIÓN TOAST ---
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}