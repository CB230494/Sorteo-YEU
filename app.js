const STORAGE_KEY = "venta_numeros_loteria_cr_v1";

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
  cargarDatos();
  enlazarEventos();
  pintarTodo();
});

function enlazarEventos() {
  $("guardarSorteoBtn").addEventListener("click", guardarSorteo);
  $("limpiarSorteoBtn").addEventListener("click", limpiarTodo);
  $("enviarWhatsappBtn").addEventListener("click", enviarWhatsapp);
  $("exportarBtn").addEventListener("click", exportarRespaldo);
  $("importarArchivo").addEventListener("change", importarRespaldo);

  $("guardarNumeroBtn").addEventListener("click", guardarNumero);
  $("liberarNumeroBtn").addEventListener("click", liberarNumero);
  $("cerrarModalBtn").addEventListener("click", cerrarModal);

  $("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") cerrarModal();
  });
}

function cargarDatos() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch {
      guardarDatos();
    }
  }

  if (!state.numeros) state.numeros = {};
  if (!state.sorteo) {
    state.sorteo = {
      nombre: "",
      fechaJuego: "",
      premios: "",
      precioNumero: ""
    };
  }
}

function guardarDatos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function guardarSorteo() {
  state.sorteo = {
    nombre: $("nombreSorteo").value.trim(),
    fechaJuego: $("fechaJuego").value,
    premios: $("premios").value.trim(),
    precioNumero: $("precioNumero").value.trim()
  };

  guardarDatos();
  actualizarListaDisponibles();
  alert("Sorteo guardado correctamente.");
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

function guardarNumero() {
  const numero = $("modalNumero").textContent;
  const nombre = $("compradorNombre").value.trim();
  const telefono = $("compradorTelefono").value.trim();
  const pagado = $("estadoPago").value;
  const observacion = $("observacion").value.trim();

  if (!nombre) {
    alert("Debe indicar el nombre.");
    return;
  }

  state.numeros[numero] = {
    nombre,
    telefono,
    pagado,
    observacion,
    fechaRegistro: new Date().toISOString()
  };

  guardarDatos();
  cerrarModal();
  pintarTodo();
}

function liberarNumero() {
  const numero = $("modalNumero").textContent;

  if (!state.numeros[numero]) {
    cerrarModal();
    return;
  }

  const ok = confirm(`¿Desea liberar el número ${numero}?`);
  if (!ok) return;

  delete state.numeros[numero];

  guardarDatos();
  cerrarModal();
  pintarTodo();
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
    ? `Fecha de juego: ${formatearFecha(state.sorteo.fechaJuego)}`
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

function limpiarTelefono(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function limpiarTodo() {
  const ok = confirm("Esto borrará todos los números vendidos y los datos del sorteo en este navegador. ¿Desea continuar?");
  if (!ok) return;

  state = {
    sorteo: {
      nombre: "",
      fechaJuego: "",
      premios: "",
      precioNumero: ""
    },
    numeros: {}
  };

  guardarDatos();
  pintarTodo();
}

function exportarRespaldo() {
  const data = {
    ...state,
    exportadoEn: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  const nombre = state.sorteo.nombre
    ? state.sorteo.nombre.replace(/\s+/g, "_").replace(/[^\w-]/g, "")
    : "sorteo";

  a.href = URL.createObjectURL(blob);
  a.download = `respaldo_${nombre}_${new Date().toISOString().slice(0,10)}.json`;
  a.click();

  URL.revokeObjectURL(a.href);
}

function importarRespaldo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      if (!data.sorteo || !data.numeros) {
        alert("El archivo no tiene el formato correcto.");
        return;
      }

      const ok = confirm("Se reemplazarán los datos actuales por el respaldo importado. ¿Desea continuar?");
      if (!ok) return;

      state = {
        sorteo: data.sorteo,
        numeros: data.numeros
      };

      guardarDatos();
      pintarTodo();
      alert("Respaldo importado correctamente.");
    } catch {
      alert("No se pudo leer el archivo de respaldo.");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
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
