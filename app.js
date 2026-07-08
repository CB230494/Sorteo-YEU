/*
  IMPORTANTE:
  1. Publicá el archivo Code.gs como Web App en Google Apps Script.
  2. Pegá aquí la URL que termina en /exec.
*/
const API_URL = "https://script.google.com/macros/s/AKfycbwsWRFWHqc-Ct_U86VlAd8lYb34W8mR8WLJZpHb4-GM3_Mqbf5G8dPh8ae4h88a6UN5aw/exec";

let state = {
  sorteo: {
    nombre: "",
    fechaJuego: "",
    premios: "",
    precioNumero: ""
  },
  numeros: {}
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  enlazarEventos();
  inicializar();
});

function enlazarEventos() {
  $("guardarSorteoBtn").addEventListener("click", guardarSorteo);
  $("recargarBtn").addEventListener("click", cargarDesdeSheets);
  $("limpiarSorteoBtn").addEventListener("click", limpiarTodo);
  $("enviarWhatsappBtn").addEventListener("click", enviarWhatsapp);

  $("guardarNumeroBtn").addEventListener("click", guardarNumero);
  $("liberarNumeroBtn").addEventListener("click", liberarNumero);
  $("cerrarModalBtn").addEventListener("click", cerrarModal);

  $("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") cerrarModal();
  });
}

function inicializar() {
  if (!API_URL || API_URL.includes("PEGA_AQUI")) {
    $("configWarning").classList.remove("hidden");
    pintarTodo();
    return;
  }

  $("configWarning").classList.add("hidden");
  cargarDesdeSheets();
}

async function api(action, payload = {}) {
  mostrarLoader(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action, payload })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Error desconocido.");
    }

    return data.result;
  } finally {
    mostrarLoader(false);
  }
}

async function cargarDesdeSheets() {
  try {
    $("estadoConexion").value = "Cargando datos...";
    const data = await api("getData");

    state = {
      sorteo: data.sorteo || {
        nombre: "",
        fechaJuego: "",
        premios: "",
        precioNumero: ""
      },
      numeros: data.numeros || {}
    };

    $("estadoConexion").value = "Conectado a Google Sheets";
    pintarTodo();
  } catch (err) {
    $("estadoConexion").value = "Error de conexión";
    alert("No se pudieron cargar los datos: " + err.message);
  }
}

function pintarTodo() {
  $("nombreSorteo").value = state.sorteo.nombre || "";
  $("fechaJuego").value = state.sorteo.fechaJuego || "";
  $("premios").value = state.sorteo.premios || "";
  $("precioNumero").value = state.sorteo.precioNumero || "";

  pintarNumeros();
  actualizarResumen();
  actualizarListaDisponibles();
}

async function guardarSorteo() {
  state.sorteo = {
    nombre: $("nombreSorteo").value.trim(),
    fechaJuego: $("fechaJuego").value,
    premios: $("premios").value.trim(),
    precioNumero: $("precioNumero").value.trim()
  };

  try {
    await api("saveSorteo", state.sorteo);
    alert("Sorteo guardado correctamente.");
    cargarDesdeSheets();
  } catch (err) {
    alert("No se pudo guardar el sorteo: " + err.message);
  }
}

function pintarNumeros() {
  const grid = $("numbersGrid");
  grid.innerHTML = "";

  for (let i = 0; i <= 99; i++) {
    const numero = String(i).padStart(2, "0");
    const registro = state.numeros[numero];

    const div = document.createElement("div");
    div.classList.add("number-card");

    if (!registro) {
      div.classList.add("disponible");
      div.innerHTML = `<strong>${numero}</strong><small>Disponible</small>`;
    } else if (registro.pagado === "PAGADO") {
      div.classList.add("pagado");
      div.innerHTML = `<strong>${numero}</strong><small>${escapeHtml(registro.nombre)}</small>`;
    } else {
      div.classList.add("vendido");
      div.innerHTML = `<strong>${numero}</strong><small>${escapeHtml(registro.nombre)}</small>`;
    }

    div.addEventListener("click", () => abrirModal(numero));
    grid.appendChild(div);
  }
}

function abrirModal(numero) {
  const registro = state.numeros[numero];

  $("modalNumero").textContent = numero;
  $("compradorNombre").value = registro?.nombre || "";
  $("compradorTelefono").value = registro?.telefono || "";
  $("estadoPago").value = registro?.pagado || "PENDIENTE";
  $("observacion").value = registro?.observacion || "";

  $("liberarNumeroBtn").style.display = registro ? "inline-flex" : "none";
  $("modal").classList.remove("hidden");
}

function cerrarModal() {
  $("modal").classList.add("hidden");
}

async function guardarNumero() {
  const numero = $("modalNumero").textContent;
  const nombre = $("compradorNombre").value.trim();
  const telefono = $("compradorTelefono").value.trim();
  const pagado = $("estadoPago").value;
  const observacion = $("observacion").value.trim();

  if (!nombre) {
    alert("Debe indicar el nombre.");
    return;
  }

  const registro = {
    numero,
    nombre,
    telefono,
    pagado,
    observacion
  };

  try {
    await api("saveNumero", registro);
    cerrarModal();
    await cargarDesdeSheets();
  } catch (err) {
    alert("No se pudo guardar el número: " + err.message);
  }
}

async function liberarNumero() {
  const numero = $("modalNumero").textContent;

  if (!state.numeros[numero]) {
    cerrarModal();
    return;
  }

  const ok = confirm(`¿Desea liberar el número ${numero}?`);
  if (!ok) return;

  try {
    await api("deleteNumero", { numero });
    cerrarModal();
    await cargarDesdeSheets();
  } catch (err) {
    alert("No se pudo liberar el número: " + err.message);
  }
}

function actualizarResumen() {
  const registros = Object.values(state.numeros);
  const vendidos = registros.length;
  const pagados = registros.filter(r => r.pagado === "PAGADO").length;
  const pendientes = vendidos - pagados;

  $("totalVendidos").textContent = vendidos;
  $("totalDisponibles").textContent = 100 - vendidos;
  $("totalPagados").textContent = pagados;
  $("totalPendientes").textContent = pendientes;
}

function obtenerDisponibles() {
  const disponibles = [];

  for (let i = 0; i <= 99; i++) {
    const numero = String(i).padStart(2, "0");
    if (!state.numeros[numero]) disponibles.push(numero);
  }

  return disponibles;
}

function actualizarListaDisponibles() {
  const disponibles = obtenerDisponibles();

  const titulo = state.sorteo.nombre
    ? `Sorteo: ${state.sorteo.nombre}`
    : "Sorteo de números";

  const fecha = state.sorteo.fechaJuego
    ? `Fecha del Sorteo: ${formatearFecha(state.sorteo.fechaJuego)}`
    : "";

  const premio = state.sorteo.premios
    ? `Premio(s): ${state.sorteo.premios}`
    : "";

  const precio = state.sorteo.precioNumero
    ? `Precio por número: ${state.sorteo.precioNumero}`
    : "";

  const mensaje = [
    titulo,
    fecha,
    premio,
    precio,
    "",
    "Números disponibles:",
    disponibles.join(", ")
  ].filter(Boolean).join("\n");

  $("listaDisponibles").value = mensaje;
}

function enviarWhatsapp() {
  const telefono = limpiarTelefono($("telefonoWhatsapp").value);

  if (!telefono) {
    alert("Digite el número de teléfono.");
    return;
  }

  actualizarListaDisponibles();

  let numeroDestino = telefono;
  if (numeroDestino.length === 8) {
    numeroDestino = "506" + numeroDestino;
  }

  const mensaje = $("listaDisponibles").value;
  const url = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
}

async function limpiarTodo() {
  const ok = confirm("Esto borrará todos los números vendidos y los datos del sorteo en Google Sheets. ¿Desea continuar?");
  if (!ok) return;

  try {
    await api("clearAll");
    await cargarDesdeSheets();
  } catch (err) {
    alert("No se pudo limpiar el sorteo: " + err.message);
  }
}

function limpiarTelefono(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "";
  const partes = fechaISO.split("-");
  if (partes.length !== 3) return fechaISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escapeHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mostrarLoader(show) {
  $("loader").classList.toggle("hidden", !show);
}
