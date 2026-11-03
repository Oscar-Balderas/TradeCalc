"use strict";

// TradeCalc — Commodity Commission Calculator
// Exchange rates provided by Frankfurter API v2.

const API_BASE = "https://api.frankfurter.dev/v2";

const campos = {
  toneladas: document.getElementById("contrato-metricT"),
  meses: document.getElementById("contrato-mesesD"),
  comisionComprador: document.getElementById("grupoComprador-comision"),
  integrantesComprador: document.getElementById("grupoComprador-integrantes"),
  comisionVendedor: document.getElementById("grupoVendedor-comision"),
  integrantesVendedor: document.getElementById("grupoVendedor-integrantes"),
  moneda: document.getElementById("moneda-destino"),
  tipoCambio: document.getElementById("tipo-cambio"),
};

const resultados = {
  comprador: document.getElementById("resultado-comprador"),
  vendedor: document.getElementById("resultado-vendedor"),
  tonelada: document.getElementById("resultado-tonelada"),
  mensual: document.getElementById("resultado-mensual"),
  total: document.getElementById("resultado-total"),
  conversion: document.getElementById("resultado-conversion"),
};

const estadoTipoCambio = document.getElementById("estado-tipo-cambio");
const radiosGrupo = document.querySelectorAll('input[name="grupo"]');
const botonReiniciar = document.getElementById("reiniciar");

const valoresIniciales = {
  toneladas: "100000",
  meses: "12",
  comisionComprador: "1",
  integrantesComprador: "4",
  comisionVendedor: "1",
  integrantesVendedor: "4",
  moneda: "MXN",
  grupo: "comprador",
};

let tipoCambioActual = null;
let monedaCotizada = null;
let solicitudActual = 0;

function leerNumero(campo) {
  if (campo.value.trim() === "") {
    return NaN;
  }

  return Number(campo.value);
}

function esNoNegativo(numero) {
  return Number.isFinite(numero) && numero >= 0;
}

function esEnteroPositivo(numero) {
  return Number.isInteger(numero) && numero >= 1;
}

function formatoMoneda(cantidad, moneda = "USD") {
  if (!Number.isFinite(cantidad)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cantidad);
  } catch {
    return `${cantidad.toFixed(2)} ${moneda}`;
  }
}

function formatoPorTonelada(cantidad) {
  if (!Number.isFinite(cantidad)) {
    return "—";
  }

  return `$${cantidad.toFixed(4)} USD/MT`;
}

function calcularPorIntegrante(comision, integrantes) {
  if (!esNoNegativo(comision) || !esEnteroPositivo(integrantes)) {
    return NaN;
  }

  return comision / integrantes;
}

function obtenerGrupoSeleccionado() {
  return (
    document.querySelector('input[name="grupo"]:checked')?.value ?? "comprador"
  );
}

function actualizarResultados() {
  const toneladas = leerNumero(campos.toneladas);
  const meses = leerNumero(campos.meses);

  const comisionComprador = leerNumero(campos.comisionComprador);
  const integrantesComprador = leerNumero(campos.integrantesComprador);

  const comisionVendedor = leerNumero(campos.comisionVendedor);
  const integrantesVendedor = leerNumero(campos.integrantesVendedor);

  const porIntegranteComprador = calcularPorIntegrante(
    comisionComprador,
    integrantesComprador,
  );

  const porIntegranteVendedor = calcularPorIntegrante(
    comisionVendedor,
    integrantesVendedor,
  );

  resultados.comprador.textContent = formatoPorTonelada(
    porIntegranteComprador,
  ).replace("/MT", "");

  resultados.vendedor.textContent = formatoPorTonelada(
    porIntegranteVendedor,
  ).replace("/MT", "");

  const grupo = obtenerGrupoSeleccionado();

  const comisionPorTonelada =
    grupo === "vendedor" ? porIntegranteVendedor : porIntegranteComprador;

  const contratoValido = esNoNegativo(toneladas) && esEnteroPositivo(meses);

  const ingresoMensual =
    contratoValido && Number.isFinite(comisionPorTonelada)
      ? comisionPorTonelada * toneladas
      : NaN;

  const ingresoTotal = Number.isFinite(ingresoMensual)
    ? ingresoMensual * meses
    : NaN;

  resultados.tonelada.textContent = formatoPorTonelada(comisionPorTonelada);

  resultados.mensual.textContent = formatoMoneda(ingresoMensual);

  resultados.total.textContent = formatoMoneda(ingresoTotal);

  const moneda = campos.moneda.value;

  const conversionValida =
    Number.isFinite(ingresoTotal) &&
    Number.isFinite(tipoCambioActual) &&
    monedaCotizada === moneda;

  const convertido = conversionValida ? ingresoTotal * tipoCambioActual : NaN;

  resultados.conversion.textContent = formatoMoneda(convertido, moneda);
}

async function cargarDivisas() {
  campos.moneda.disabled = true;
  campos.moneda.innerHTML = '<option value="">Loading currencies...</option>';

  try {
    const respuesta = await fetch(`${API_BASE}/currencies`);

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const divisas = await respuesta.json();

    if (!Array.isArray(divisas)) {
      throw new Error("Invalid currencies response");
    }

    const monedasValidas = divisas
      .filter(
        (divisa) =>
          typeof divisa.iso_code === "string" &&
          /^[A-Z]{3}$/.test(divisa.iso_code) &&
          typeof divisa.name === "string" &&
          divisa.iso_code !== "USD",
      )
      .sort((a, b) => a.iso_code.localeCompare(b.iso_code));

    if (monedasValidas.length === 0) {
      throw new Error("No currencies available");
    }

    campos.moneda.replaceChildren();

    for (const divisa of monedasValidas) {
      const opcion = document.createElement("option");

      opcion.value = divisa.iso_code;
      opcion.textContent = `${divisa.iso_code} - ${divisa.name}`;

      campos.moneda.appendChild(opcion);
    }

    const monedaInicial = valoresIniciales.moneda;

    campos.moneda.value = monedasValidas.some(
      (divisa) => divisa.iso_code === monedaInicial,
    )
      ? monedaInicial
      : monedasValidas[0].iso_code;

    campos.moneda.disabled = false;

    await obtenerTipoCambio();
  } catch (error) {
    console.error("Error loading currencies:", error);

    campos.moneda.innerHTML =
      '<option value="">Currencies unavailable</option>';

    campos.tipoCambio.value = "";
    tipoCambioActual = null;
    monedaCotizada = null;

    estadoTipoCambio.textContent =
      "Unable to load currencies. Check your connection and reload.";

    actualizarResultados();
  }
}

async function obtenerTipoCambio() {
  const moneda = campos.moneda.value;
  const numeroSolicitud = ++solicitudActual;

  tipoCambioActual = null;
  monedaCotizada = null;
  campos.tipoCambio.value = "";

  estadoTipoCambio.textContent = "Loading exchange rate...";

  actualizarResultados();

  if (!moneda) {
    estadoTipoCambio.textContent = "Select a currency.";
    return;
  }

  try {
    const respuesta = await fetch(
      `${API_BASE}/rate/USD/${encodeURIComponent(moneda)}`,
    );

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    // Ignorar respuestas antiguas si el usuario cambió de moneda.
    if (numeroSolicitud !== solicitudActual) {
      return;
    }

    if (
      datos.base !== "USD" ||
      datos.quote !== moneda ||
      !Number.isFinite(datos.rate) ||
      datos.rate <= 0 ||
      typeof datos.date !== "string"
    ) {
      throw new Error("Invalid exchange rate response");
    }

    tipoCambioActual = datos.rate;
    monedaCotizada = moneda;

    campos.tipoCambio.value = String(datos.rate);

    estadoTipoCambio.textContent = `Reference exchange rate · ${datos.date} · Frankfurter API`;

    actualizarResultados();
  } catch (error) {
    if (numeroSolicitud !== solicitudActual) {
      return;
    }

    console.error("Error fetching exchange rate:", error);

    tipoCambioActual = null;
    monedaCotizada = null;
    campos.tipoCambio.value = "";

    estadoTipoCambio.textContent =
      "Exchange rate unavailable. Try selecting the currency again.";

    actualizarResultados();
  }
}

async function reiniciarEjemplo() {
  for (const [nombre, valor] of Object.entries(valoresIniciales)) {
    if (nombre !== "grupo" && nombre !== "moneda") {
      campos[nombre].value = valor;
    }
  }

  for (const radio of radiosGrupo) {
    radio.checked = radio.value === valoresIniciales.grupo;
  }

  if (!campos.moneda.disabled) {
    const existeMXN = Array.from(campos.moneda.options).some(
      (opcion) => opcion.value === valoresIniciales.moneda,
    );

    if (existeMXN) {
      campos.moneda.value = valoresIniciales.moneda;
    }

    await obtenerTipoCambio();
  } else {
    actualizarResultados();
  }
}

// Eventos de los campos de cálculo.
for (const [nombre, campo] of Object.entries(campos)) {
  if (nombre === "moneda" || nombre === "tipoCambio") {
    continue;
  }

  campo.addEventListener("input", actualizarResultados);
}

// Cambiar moneda consulta nuevamente la API.
campos.moneda.addEventListener("change", obtenerTipoCambio);

for (const radio of radiosGrupo) {
  radio.addEventListener("change", actualizarResultados);
}

botonReiniciar.addEventListener("click", reiniciarEjemplo);

// Inicializar la aplicación.
actualizarResultados();
cargarDivisas();
