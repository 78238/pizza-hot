
/* ==========================================
   CONFIGURACIÓN DE SUPABASE
========================================== */
const SUPABASE_URL = "https://jomfuntsajqavrewccyx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_E8zDsiCI2JbAcwsSYS7JAg_g7Owt4DR";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ==========================================
   VARIABLES GLOBALES
========================================== */
let ingredients = [];
let allIngredientsDB = [];
let catalogPizzas = [];
let allClients = [];

const customers = [
  "Carlos", "María", "Sofía", "Diego",
  "Valentina", "Andrés", "Fernanda", "Luis"
];

const $ = id => document.getElementById(id);

/* ==========================================
   REFERENCIAS DE ELEMENTOS HTML
========================================== */
const ui = {
  // Navegación
  menuSalesBtn: $("menuSalesBtn"),
  menuNewSaleBtn: $("menuNewSaleBtn"),
  menuClientsBtn: $("menuClientsBtn"),
  menuIngredientsBtn: $("menuIngredientsBtn"),
  menuGameBtn: $("menuGameBtn"),

  // Vistas
  salesView: $("salesView"),
  clientsView: $("clientsView"),
  ingredientsView: $("ingredientsView"),
  gameView: $("gameView"),

  // Ventas
  salesTableBody: $("salesTableBody"),
  kpiTotalOrders: $("kpiTotalOrders"),
  kpiTotalRevenue: $("kpiTotalRevenue"),
  kpiTotalPizzas: $("kpiTotalPizzas"),
  refreshSalesBtn: $("refreshSalesBtn"),
  quickNewSaleBtn: $("quickNewSaleBtn"),

  // Clientes
  clientForm: $("clientForm"),
  clientId: $("clientId"),
  clientName: $("clientName"),
  clientPhone: $("clientPhone"),
  clientAddress: $("clientAddress"),
  clientsTableBody: $("clientsTableBody"),
  clientSearch: $("clientSearch"),
  clientsCount: $("clientsCount"),
  saveClientBtn: $("saveClientBtn"),
  cancelClientEditBtn: $("cancelClientEditBtn"),
  refreshClientsBtn: $("refreshClientsBtn"),

  // Modal de ventas
  saleModal: $("saleModal"),
  closeSaleModalBtn: $("closeSaleModalBtn"),
  saleForm: $("saleForm"),
  salePizzaSelect: $("salePizzaSelect"),
  saleQuantity: $("saleQuantity"),
  saleTotalDisplay: $("saleTotalDisplay"),

  // Ingredientes
  ingredientForm: $("ingredientForm"),
  ingredientsTableBody: $("ingredientsTableBody"),
  saveIngBtn: $("saveIngBtn"),
  cancelEditIngBtn: $("cancelEditIngBtn"),

  // Juego
  playerName: $("playerName"),
  levelLabel: $("levelLabel"),
  scoreLabel: $("scoreLabel"),
  ingredientsGrid: $("ingredientsGrid"),
  customerOrder: $("customerOrder"),
  customerName: $("customerName"),
  stepDescription: $("stepDescription"),
  progressBar: $("progressBar"),
  progressText: $("progressText"),
  timeLabel: $("timeLabel"),
  timeBonus: $("timeBonus"),
  pizzaSurface: $("pizzaSurface"),
  pizzaSvg: $("pizzaSvg"),
  paintLayer: $("paintLayer"),
  toppingsLayer: $("toppingsLayer"),
  pizzaCard: $("pizzaCard"),
  pizzaStatus: $("pizzaStatus"),
  deliverButton: $("deliverButton"),
  dropZone: $("dropZone"),
  startNewGameBtn: $("startNewGameBtn"),
  messageModal: $("messageModal"),
  messageTitle: $("messageTitle"),
  messageText: $("messageText"),
  messageButton: $("messageButton"),
  rankingList: $("rankingList"),
  exportButton: $("exportButton")
};

/* ==========================================
   FUNCIONES AUXILIARES
========================================== */

function createCell(tag, text = "") {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

/* ==========================================
   NAVEGACIÓN PRINCIPAL
========================================== */

function switchView(activeView, activeBtn) {
  [
    ui.salesView,
    ui.clientsView,
    ui.ingredientsView,
    ui.gameView
  ].forEach(view => view.classList.add("hidden-view"));

  [
    ui.menuSalesBtn,
    ui.menuNewSaleBtn,
    ui.menuClientsBtn,
    ui.menuIngredientsBtn,
    ui.menuGameBtn
  ].forEach(btn => btn.classList.remove("active"));

  activeView.classList.remove("hidden-view");

  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

ui.menuSalesBtn.addEventListener("click", async () => {
  switchView(ui.salesView, ui.menuSalesBtn);
  ui.levelLabel.textContent = "BASE DE DATOS ACTIVA";
  await loadSalesHistory();
});

ui.menuClientsBtn.addEventListener("click", async () => {
  switchView(ui.clientsView, ui.menuClientsBtn);
  ui.levelLabel.textContent = "Gestión de clientes";
  await loadClients();
});

ui.menuIngredientsBtn.addEventListener("click", async () => {
  switchView(ui.ingredientsView, ui.menuIngredientsBtn);
  ui.levelLabel.textContent = "Inventario";
  await loadIngredientsFromDB();
});

ui.menuGameBtn.addEventListener("click", async () => {
  switchView(ui.gameView, ui.menuGameBtn);
  ui.levelLabel.textContent = `Nivel ${level} / ${TOTAL_LEVELS}`;
  await loadIngredientsFromDB();
});

async function openNewSaleModal() {
  await loadPizzasCatalog();
  ui.saleModal.classList.remove("hidden");
}

ui.menuNewSaleBtn.addEventListener("click", openNewSaleModal);
ui.quickNewSaleBtn.addEventListener("click", openNewSaleModal);

ui.refreshSalesBtn.addEventListener("click", loadSalesHistory);

ui.closeSaleModalBtn.addEventListener("click", () => {
  ui.saleModal.classList.add("hidden");
});

/* ==========================================
   ISSUE-014
   REGISTRO Y EDICIÓN DE CLIENTES
========================================== */

/*
  CONSULTAR CLIENTES

  Obtiene los clientes almacenados en Supabase.
*/
async function loadClients() {
  ui.clientsTableBody.innerHTML =
    '<tr><td colspan="5">Consultando clientes...</td></tr>';

  const { data, error } = await supabaseClient
    .from("datos_cliente")
    .select("identificacion, nombre, telefono, direccion")
    .order("identificacion", { ascending: true });

  if (error) {
    console.error("Error al consultar clientes:", error.message);

    ui.clientsTableBody.innerHTML =
      '<tr><td colspan="5">Error al cargar clientes.</td></tr>';

    alert("No se pudieron cargar los clientes: " + error.message);
    return;
  }

  allClients = data || [];

  searchClients();
}

/*
  MOSTRAR CLIENTES

  Construye la tabla utilizando los registros
  recuperados desde Supabase.
*/
function renderClientsTable(clients) {
  ui.clientsTableBody.replaceChildren();

  ui.clientsCount.textContent =
    `Total de clientes: ${clients.length}`;

  if (clients.length === 0) {
    const row = document.createElement("tr");
    const cell = createCell("td", "No se encontraron clientes registrados.");

    cell.colSpan = 5;
    row.appendChild(cell);
    ui.clientsTableBody.appendChild(row);
    return;
  }

  clients.forEach(client => {
    const row = document.createElement("tr");

    const idCell = createCell("td", client.identificacion);
    const nameCell = createCell("td", client.nombre);
    const phoneCell = createCell("td", client.telefono ?? "-");
    const addressCell = createCell("td", client.direccion || "Sin dirección");

    const actionsCell = document.createElement("td");

    const editButton = createCell("button", "✏️ Editar");
    editButton.type = "button";
    editButton.className = "btn-sm btn-edit";

    editButton.addEventListener("click", () => {
      editClient(client.identificacion);
    });

    actionsCell.appendChild(editButton);

    row.append(
      idCell,
      nameCell,
      phoneCell,
      addressCell,
      actionsCell
    );

    ui.clientsTableBody.appendChild(row);
  });
}

/*
  BUSCAR CLIENTES

  Permite localizar registros por nombre o teléfono.
*/
function searchClients() {
  const search = ui.clientSearch.value
    .trim()
    .toLowerCase();

  const filteredClients = allClients.filter(client => {
    const name = String(client.nombre || "").toLowerCase();
    const phone = String(client.telefono || "");

    return name.includes(search) || phone.includes(search);
  });

  renderClientsTable(filteredClients);
}

ui.clientSearch.addEventListener("input", searchClients);

ui.refreshClientsBtn.addEventListener("click", loadClients);

/*
  VALIDAR DATOS DEL CLIENTE

  Nombre obligatorio.
  Teléfono obligatorio y de 10 dígitos.
  Dirección opcional.
*/
function validateClient() {
  const name = ui.clientName.value.trim();
  const phone = ui.clientPhone.value.trim();

  if (!name) {
    alert("⚠️ El nombre del cliente es obligatorio.");
    ui.clientName.focus();
    return false;
  }

  if (!phone) {
    alert("⚠️ El teléfono del cliente es obligatorio.");
    ui.clientPhone.focus();
    return false;
  }

  if (!/^\d{10}$/.test(phone)) {
    alert("⚠️ El teléfono debe contener exactamente 10 dígitos.");
    ui.clientPhone.focus();
    return false;
  }

  return true;
}

/*
  REGISTRAR CLIENTE

  Inserta un nuevo registro en datos_cliente.
*/
async function registerClient() {
  const name = ui.clientName.value.trim();
  const phone = ui.clientPhone.value.trim();
  const address = ui.clientAddress.value.trim();

  const { data, error } = await supabaseClient
    .from("datos_cliente")
    .insert([{
      nombre: name,
      telefono: Number(phone),
      direccion: address || null
    }])
    .select("identificacion, nombre, telefono, direccion")
    .single();

  if (error) {
    console.error("Error al registrar cliente:", error.message);

    alert("❌ No se pudo registrar el cliente:\n" + error.message);
    return false;
  }

  alert(
    "✅ Cliente registrado correctamente.\n\n" +
    "Nombre: " + data.nombre +
    "\nTeléfono: " + data.telefono
  );

  return true;
}

/*
  LOCALIZAR Y EDITAR CLIENTE

  Carga los datos del registro seleccionado
  dentro del formulario.
*/
function editClient(id) {
  const client = allClients.find(
    item => String(item.identificacion) === String(id)
  );

  if (!client) {
    alert("No se encontró el cliente seleccionado.");
    return;
  }

  ui.clientId.value = client.identificacion;
  ui.clientName.value = client.nombre || "";
  ui.clientPhone.value = client.telefono ?? "";
  ui.clientAddress.value = client.direccion || "";

  ui.saveClientBtn.textContent = "💾 Guardar Cambios";
  ui.cancelClientEditBtn.classList.remove("hidden");

  ui.clientForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  ui.clientName.focus();
}

/*
  ACTUALIZAR CLIENTE

  Modifica el registro seleccionado
  en la tabla datos_cliente.
*/
async function updateClient() {
  const id = ui.clientId.value;

  const name = ui.clientName.value.trim();
  const phone = ui.clientPhone.value.trim();
  const address = ui.clientAddress.value.trim();

  const { error } = await supabaseClient
    .from("datos_cliente")
    .update({
      nombre: name,
      telefono: Number(phone),
      direccion: address || null
    })
    .eq("identificacion", id);

  if (error) {
    console.error("Error al actualizar cliente:", error.message);

    alert("❌ No se pudieron actualizar los datos:\n" + error.message);
    return false;
  }

  alert("✅ Los datos del cliente se actualizaron correctamente.");

  return true;
}

/*
  RESTABLECER FORMULARIO

  Limpia los campos y regresa el botón
  al modo de registro.
*/
function resetClientForm() {
  ui.clientForm.reset();
  ui.clientId.value = "";

  ui.saveClientBtn.textContent = "➕ Registrar Cliente";
  ui.cancelClientEditBtn.classList.add("hidden");
}

/*
  EVENTO DEL FORMULARIO

  Si existe un ID, actualiza.
  Si no existe, registra un cliente nuevo.
*/
ui.clientForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!validateClient()) {
    return;
  }

  ui.saveClientBtn.disabled = true;

  try {
    let success;

    if (ui.clientId.value) {
      success = await updateClient();
    } else {
      success = await registerClient();
    }

    if (success) {
      resetClientForm();
      await loadClients();
    }
  } catch (error) {
    console.error("Error en el formulario de clientes:", error);
    alert("Ocurrió un error inesperado: " + error.message);
  } finally {
    ui.saveClientBtn.disabled = false;
  }
});

/*
  CANCELAR EDICIÓN
*/
ui.cancelClientEditBtn.addEventListener("click", () => {
  resetClientForm();
});

/* ==========================================
   1. PANTALLA PRINCIPAL: VENTAS Y KPIs
========================================== */

async function loadSalesHistory() {
  ui.salesTableBody.innerHTML =
    '<tr><td colspan="7">Consultando ventas en Supabase...</td></tr>';

  const { data, error } = await supabaseClient
    .from("pedidos")
    .select(`
      identificacion,
      folio_venta,
      estado_pedido,
      fecha_hora,
      datos_cliente ( nombre, telefono ),
      pedido_pizza (
        cantidad_pizzas,
        precio_momento,
        pizzas ( nombre, tamano )
      )
    `)
    .order("fecha_hora", { ascending: false });

  if (error) {
    ui.salesTableBody.innerHTML =
      '<tr><td colspan="7">Error al cargar ventas.</td></tr>';

    console.error(error.message);
    return;
  }

  const totalOrders = data ? data.length : 0;
  let totalRevenue = 0;
  let totalPizzas = 0;

  ui.salesTableBody.replaceChildren();

  if (!data || data.length === 0) {
    ui.kpiTotalOrders.textContent = "0";
    ui.kpiTotalRevenue.textContent = "$0.00";
    ui.kpiTotalPizzas.textContent = "0";

    ui.salesTableBody.innerHTML =
      '<tr><td colspan="7">Aún no hay ventas registradas.</td></tr>';

    return;
  }

  data.forEach(pedido => {
    const fecha = pedido.fecha_hora
      ? new Date(pedido.fecha_hora).toLocaleString("es-MX")
      : "Sin fecha";

    const clienteNombre = pedido.datos_cliente?.nombre || "Mostrador";
    const clienteTel = pedido.datos_cliente?.telefono || "-";

    let totalVenta = 0;

    const detalles = (pedido.pedido_pizza || []).map(det => {
      const subtotal =
        Number(det.cantidad_pizzas) * Number(det.precio_momento);

      totalVenta += subtotal;
      totalPizzas += Number(det.cantidad_pizzas);

      const pizzaNombre = det.pizzas?.nombre || "Pizza";

      return `${det.cantidad_pizzas}x ${pizzaNombre} (${formatMoney(det.precio_momento)} c/u)`;
    }).join(" | ");

    totalRevenue += totalVenta;

    const row = document.createElement("tr");

    const values = [
      "#" + (pedido.folio_venta || pedido.identificacion),
      fecha,
      clienteNombre,
      clienteTel,
      detalles || "Sin detalle",
      formatMoney(totalVenta),
      pedido.estado_pedido || "Completado"
    ];

    values.forEach(value => {
      row.appendChild(createCell("td", value));
    });

    ui.salesTableBody.appendChild(row);
  });

  ui.kpiTotalOrders.textContent = totalOrders;
  ui.kpiTotalRevenue.textContent = formatMoney(totalRevenue);
  ui.kpiTotalPizzas.textContent = totalPizzas;
}

/* ==========================================
   2. REGISTRAR VENTAS
========================================== */

async function loadPizzasCatalog() {
  const { data, error } = await supabaseClient
    .from("pizzas")
    .select("identificacion, nombre, tamano, precio");

  if (error) {
    console.error("Error cargando catálogo:", error.message);
    alert("No se pudo cargar el catálogo de pizzas.");
    return;
  }

  catalogPizzas = data || [];
  ui.salePizzaSelect.replaceChildren();

  if (catalogPizzas.length === 0) {
    const option = createCell("option", "No hay pizzas registradas");
    option.value = "";
    ui.salePizzaSelect.appendChild(option);
    updateSaleTotal();
    return;
  }

  const placeholder = createCell("option", "Selecciona una pizza");
  placeholder.value = "";
  ui.salePizzaSelect.appendChild(placeholder);

  catalogPizzas.forEach(pizza => {
    const option = createCell(
      "option",
      `${pizza.nombre} (${pizza.tamano || "Estándar"}) - ${formatMoney(pizza.precio)}`
    );

    option.value = pizza.identificacion;
    option.dataset.precio = pizza.precio;

    ui.salePizzaSelect.appendChild(option);
  });

  updateSaleTotal();
}

function updateSaleTotal() {
  const selectedOption = ui.salePizzaSelect.selectedOptions[0];

  const price = selectedOption
    ? parseFloat(selectedOption.dataset.precio || 0)
    : 0;

  const qty = Math.max(1, parseInt(ui.saleQuantity.value || 1, 10));

  ui.saleTotalDisplay.value = formatMoney(price * qty);
}

ui.salePizzaSelect.addEventListener("change", updateSaleTotal);
ui.saleQuantity.addEventListener("input", updateSaleTotal);

ui.saleForm.addEventListener("submit", async event => {
  event.preventDefault();

  const clientName = $("saleClientName").value.trim();
  const clientPhone = $("saleClientPhone").value.trim();
  const clientAddress = $("saleClientAddress").value.trim();

  const idPizza = ui.salePizzaSelect.value;
  const cantidad = parseInt(ui.saleQuantity.value, 10);

  if (!clientName) {
    alert("Escribe el nombre del cliente.");
    return;
  }

  if (!idPizza) {
    alert("Selecciona una pizza válida.");
    return;
  }

  if (!Number.isInteger(cantidad) || cantidad < 1) {
    alert("La cantidad debe ser de al menos una pizza.");
    return;
  }

  const selectedPizza = catalogPizzas.find(
    pizza => String(pizza.identificacion) === String(idPizza)
  );

  if (!selectedPizza) {
    alert("La pizza seleccionada ya no está disponible.");
    return;
  }

  const precioMomento = Number(selectedPizza.precio);

  try {
    const { data: clienteData, error: clienteError } =
      await supabaseClient
        .from("datos_cliente")
        .insert([{
          nombre: clientName,
          telefono: clientPhone ? Number(clientPhone) : null,
          direccion: clientAddress || null
        }])
        .select("identificacion")
        .single();

    if (clienteError) {
      throw new Error("Cliente: " + clienteError.message);
    }

    const folioGenerado = Math.floor(100000 + Math.random() * 900000);

    const { data: pedidoData, error: pedidoError } =
      await supabaseClient
        .from("pedidos")
        .insert([{
          id_cliente: clienteData.identificacion,
          folio_venta: folioGenerado,
          estado_pedido: "Completado"
        }])
        .select("identificacion")
        .single();

    if (pedidoError) {
      throw new Error("Pedido: " + pedidoError.message);
    }

    const { error: detalleError } = await supabaseClient
      .from("pedido_pizza")
      .insert([{
        id_pedido: pedidoData.identificacion,
        id_pizza: selectedPizza.identificacion,
        cantidad_pizzas: cantidad,
        precio_momento: precioMomento
      }]);

    if (detalleError) {
      throw new Error("Detalle: " + detalleError.message);
    }

    alert(
      `✅ Venta registrada.\nFolio: #${folioGenerado}\nTotal: ${formatMoney(precioMomento * cantidad)}`
    );

    ui.saleForm.reset();
    ui.saleModal.classList.add("hidden");

    switchView(ui.salesView, ui.menuSalesBtn);
    await loadSalesHistory();

  } catch (error) {
    alert("❌ Error al registrar venta: " + error.message);
  }
});

/* ==========================================
   3. GESTIÓN DE INGREDIENTES
========================================== */

async function loadIngredientsFromDB() {
  const { data, error } = await supabaseClient
    .from("ingredientes")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error cargando ingredientes:", error.message);
    alert("No se pudieron cargar los ingredientes.");
    return;
  }

  allIngredientsDB = data || [];

  ingredients = allIngredientsDB
    .filter(item => item.activo)
    .map(item => ({
      id: String(item.id),
      name: item.nombre,
      icon: item.icono || "🍕",
      price: item.precio,
      category: item.categoria
    }));

  renderIngredients();
  renderIngredientsAdminTable();
}

function renderIngredientsAdminTable() {
  ui.ingredientsTableBody.replaceChildren();

  if (allIngredientsDB.length === 0) {
    ui.ingredientsTableBody.innerHTML =
      '<tr><td colspan="7">No hay ingredientes registrados.</td></tr>';
    return;
  }

  allIngredientsDB.forEach(ing => {
    const row = document.createElement("tr");

    row.appendChild(createCell("td", ing.id));
    row.appendChild(createCell("td", ing.icono || "🍕"));
    row.appendChild(createCell("td", ing.nombre));
    row.appendChild(createCell("td", ing.categoria));
    row.appendChild(createCell("td", formatMoney(ing.precio)));

    const statusCell = document.createElement("td");
    const status = createCell(
      "span",
      ing.activo ? "Activo" : "Inactivo"
    );

    status.className = ing.activo
      ? "badge-active"
      : "badge-inactive";

    statusCell.appendChild(status);

    const actionsCell = document.createElement("td");

    const editButton = createCell("button", "✏️ Editar");
    editButton.type = "button";
    editButton.className = "btn-sm btn-edit";

    editButton.addEventListener("click", () => {
      editIngredient(ing.id);
    });

    const toggleButton = createCell(
      "button",
      ing.activo ? "Desactivar" : "Activar"
    );

    toggleButton.type = "button";
    toggleButton.className = "btn-sm btn-toggle";

    toggleButton.addEventListener("click", () => {
      toggleIngredientStatus(ing.id, ing.activo);
    });

    actionsCell.append(editButton, toggleButton);

    row.append(
      statusCell,
      actionsCell
    );

    ui.ingredientsTableBody.appendChild(row);
  });
}

function editIngredient(id) {
  const ing = allIngredientsDB.find(
    item => String(item.id) === String(id)
  );

  if (!ing) return;

  $("ingId").value = ing.id;
  $("ingNombre").value = ing.nombre;
  $("ingCategoria").value = ing.categoria;
  $("ingPrecio").value = ing.precio;
  $("ingIcono").value = ing.icono || "🍕";

  ui.saveIngBtn.textContent = "💾 Guardar Cambios";
  ui.cancelEditIngBtn.classList.remove("hidden");

  $("ingNombre").focus();
}

function resetIngredientForm() {
  ui.ingredientForm.reset();
  $("ingId").value = "";
  $("ingIcono").value = "🍕";

  ui.saveIngBtn.textContent = "➕ Agregar Ingrediente";
  ui.cancelEditIngBtn.classList.add("hidden");
}

ui.cancelEditIngBtn.addEventListener("click", resetIngredientForm);

async function toggleIngredientStatus(id, currentStatus) {
  const { error } = await supabaseClient
    .from("ingredientes")
    .update({ activo: !currentStatus })
    .eq("id", id);

  if (error) {
    alert("Error al cambiar estado: " + error.message);
    return;
  }

  await loadIngredientsFromDB();
}

ui.ingredientForm.addEventListener("submit", async event => {
  event.preventDefault();

  const id = $("ingId").value;
  const nombre = $("ingNombre").value.trim();
  const categoria = $("ingCategoria").value;
  const precio = parseFloat($("ingPrecio").value);
  const icono = $("ingIcono").value.trim() || "🍕";

  if (!nombre || !Number.isFinite(precio) || precio < 0) {
    alert("Verifica el nombre y el precio del ingrediente.");
    return;
  }

  try {
    let error;

    if (id) {
      ({ error } = await supabaseClient
        .from("ingredientes")
        .update({ nombre, categoria, precio, icono })
        .eq("id", id));
    } else {
      ({ error } = await supabaseClient
        .from("ingredientes")
        .insert([{
          nombre,
          categoria,
          precio,
          icono,
          activo: true
        }]));
    }

    if (error) {
      alert("Error al guardar ingrediente: " + error.message);
      return;
    }

    alert(id
      ? `✅ Ingrediente "${nombre}" actualizado.`
      : `✅ Ingrediente "${nombre}" registrado.`
    );

    resetIngredientForm();
    await loadIngredientsFromDB();

  } catch (error) {
    alert("Error inesperado: " + error.message);
  }
});

/* ==========================================
   4. JUEGO: JUGAR TURNO
========================================== */

const SVG_NS = "http://www.w3.org/2000/svg";
const TOTAL_LEVELS = 5;
const INITIAL_TIME = 40;
const PAINT_TARGET = 18;

let player = "Caja 1";
let level = 1;
let score = 0;
let remainingTime = INITIAL_TIME;
let step = "idle";
let orderIngredients = [];
let selectedIngredients = [];
let paintedCells = new Set();
let drawing = false;
let lastPaintPoint = null;
let gameStarted = false;
let gameFinished = false;
let levelsCompleted = 0;
let startTimestamp = 0;
let timer = null;
let modalAction = null;

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function updateScore() {
  ui.scoreLabel.textContent = score;
}

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function updateTime() {
  ui.timeLabel.textContent = remainingTime + " s";

  if (remainingTime <= 10) {
    ui.timeLabel.style.color = "#ff7777";
    ui.timeBonus.textContent = "¡Últimos segundos!";
    ui.timeBonus.style.color = "#ff7777";
  } else {
    ui.timeLabel.style.color = "#ffdb89";
    ui.timeBonus.textContent = "Listo";
    ui.timeBonus.style.color = "#81df9a";
  }
}

function startTimer() {
  stopTimer();

  timer = setInterval(() => {
    if (!gameStarted || gameFinished) return;

    remainingTime = Math.max(0, remainingTime - 1);
    updateTime();

    if (remainingTime === 0) {
      endGame(false);
    }
  }, 1000);
}

ui.startNewGameBtn.addEventListener("click", () => {
  if (ingredients.length === 0) {
    alert("Agrega al menos un ingrediente activo en Gestionar Ingredientes antes de jugar.");
    return;
  }

  player = prompt("Escribe tu nombre para comenzar:", "Jugador");

  if (player === null) return;

  player = player.trim();

  if (!player) {
    alert("Debes escribir un nombre para jugar.");
    return;
  }

  ui.playerName.textContent = player;

  level = 1;
  score = 0;
  remainingTime = INITIAL_TIME;
  levelsCompleted = 0;

  gameStarted = true;
  gameFinished = false;

  startTimestamp = Date.now();

  updateScore();
  updateTime();

  startLevel();
  startTimer();
});

function startLevel() {
  ui.levelLabel.textContent = `Nivel ${level} / ${TOTAL_LEVELS}`;

  step = "dough";
  drawing = false;
  lastPaintPoint = null;

  paintedCells.clear();
  selectedIngredients = [];

  ui.paintLayer.replaceChildren();
  ui.toppingsLayer.replaceChildren();

  ui.pizzaCard.draggable = false;
  ui.deliverButton.disabled = true;

  ui.dropZone.classList.remove("drag-over");

  generateOrder();
  updateStep();
}

function generateOrder() {
  const ingredientCount = Math.min(
    ingredients.length,
    level <= 3 ? 3 : 5
  );

  orderIngredients = shuffle(ingredients).slice(0, ingredientCount);

  ui.customerName.textContent = randomItem(customers);
  ui.customerOrder.replaceChildren();

  const title = createCell("strong", "Pizza especial");
  ui.customerOrder.appendChild(title);

  orderIngredients.forEach(ingredient => {
    const line = createCell(
      "div",
      `${ingredient.icon} ${ingredient.name}`
    );

    ui.customerOrder.appendChild(line);
  });

  const note = createCell(
    "small",
    "¡No olvides ningún ingrediente!"
  );

  ui.customerOrder.appendChild(note);
}

function renderIngredients() {
  ui.ingredientsGrid.replaceChildren();

  ingredients.forEach(ingredient => {
    const button = document.createElement("button");

    button.className = "ingredient";
    button.type = "button";

    const icon = createCell("span", ingredient.icon);
    icon.className = "ingredient-icon";

    const name = createCell("span", ingredient.name);
    name.className = "ingredient-name";

    button.append(icon, name);

    const required = orderIngredients.some(
      item => item.id === ingredient.id
    );

    const alreadyAdded = selectedIngredients.includes(ingredient.id);

    button.disabled = gameStarted
      ? (step !== "toppings" || !required || alreadyAdded)
      : true;

    button.draggable = !button.disabled;

    button.addEventListener("dragstart", event => {
      if (button.disabled) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.setData("text/ingredient", ingredient.id);
      event.dataTransfer.effectAllowed = "copy";
    });

    button.addEventListener("click", () => {
      if (!button.disabled) {
        addIngredient(ingredient.id);
      }
    });

    ui.ingredientsGrid.appendChild(button);
  });
}

function updateStep() {
  if (step === "dough") {
    ui.stepDescription.textContent = "1. Preparar la masa";
    ui.pizzaStatus.textContent =
      "Mantén presionado y mueve el cursor sobre la masa.";
  }

  if (step === "sauce") {
    ui.stepDescription.textContent = "2. Agregar salsa";
    ui.pizzaStatus.textContent =
      "Extiende la salsa roja sobre la pizza.";
  }

  if (step === "toppings") {
    ui.stepDescription.textContent = "3. Agregar ingredientes";
    ui.pizzaStatus.textContent =
      "Arrastra o selecciona los ingredientes del pedido.";
  }

  if (step === "deliver") {
    ui.stepDescription.textContent = "4. Entregar pizza";
    ui.pizzaStatus.textContent =
      "¡Pizza lista! Entrégala al cliente.";

    ui.pizzaCard.draggable = true;
    ui.deliverButton.disabled = false;
  }

  renderIngredients();
  updateProgress();
}

function updateProgress() {
  let progress = 0;

  if (step === "dough") {
    progress = 25 * Math.min(1, paintedCells.size / PAINT_TARGET);
  }

  if (step === "sauce") {
    progress = 25 + 25 * Math.min(1, paintedCells.size / PAINT_TARGET);
  }

  if (step === "toppings") {
    progress = 50 + 40 * (
      selectedIngredients.length / orderIngredients.length
    );
  }

  if (step === "deliver") progress = 90;
  if (step === "completed") progress = 100;

  const percentage = Math.round(progress);

  ui.progressBar.style.width = percentage + "%";
  ui.progressText.textContent = percentage + "%";
}

function getPizzaPoint(event) {
  const rect = ui.pizzaSvg.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * 300 / rect.width,
    y: (event.clientY - rect.top) * 300 / rect.height
  };
}

function isInsidePizza(x, y) {
  const dx = x - 150;
  const dy = y - 150;

  return dx * dx + dy * dy <= 118 * 118;
}

function paintAt(x, y) {
  if (
    (step !== "dough" && step !== "sauce") ||
    !isInsidePizza(x, y)
  ) {
    return;
  }

  const col = Math.max(0, Math.min(6, Math.floor(x / 300 * 7)));
  const row = Math.max(0, Math.min(6, Math.floor(y / 300 * 7)));

  const key = `${row}-${col}`;

  if (paintedCells.has(key)) return;

  paintedCells.add(key);

  const circle = createSvgElement("circle", {
    cx: x,
    cy: y,
    r: step === "dough" ? 23 : 25,
    fill: step === "dough" ? "#f5d89e" : "#cf4930",
    opacity: step === "dough" ? "0.85" : "0.92"
  });

  ui.paintLayer.appendChild(circle);

  updateProgress();

  if (paintedCells.size >= PAINT_TARGET) {
    finishPaintingStep();
  }
}

function paintMovement(event) {
  if (!drawing) return;

  const point = getPizzaPoint(event);

  if (lastPaintPoint) {
    const distance = Math.hypot(
      point.x - lastPaintPoint.x,
      point.y - lastPaintPoint.y
    );

    const steps = Math.max(1, Math.ceil(distance / 8));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;

      paintAt(
        lastPaintPoint.x + (point.x - lastPaintPoint.x) * t,
        lastPaintPoint.y + (point.y - lastPaintPoint.y) * t
      );
    }
  } else {
    paintAt(point.x, point.y);
  }

  lastPaintPoint = point;
}

ui.pizzaSurface.addEventListener("pointerdown", event => {
  if (
    !gameStarted ||
    gameFinished ||
    (step !== "dough" && step !== "sauce")
  ) {
    return;
  }

  event.preventDefault();

  drawing = true;
  lastPaintPoint = null;

  ui.pizzaSurface.setPointerCapture(event.pointerId);

  paintMovement(event);
});

ui.pizzaSurface.addEventListener("pointermove", paintMovement);

ui.pizzaSurface.addEventListener("pointerup", () => {
  drawing = false;
  lastPaintPoint = null;
});

ui.pizzaSurface.addEventListener("pointercancel", () => {
  drawing = false;
  lastPaintPoint = null;
});

function finishPaintingStep() {
  drawing = false;
  lastPaintPoint = null;

  paintedCells.clear();

  if (step === "dough") {
    score += 150;
    updateScore();

    step = "sauce";
    updateStep();
    return;
  }

  if (step === "sauce") {
    score += 150;
    updateScore();

    const sauceBase = createSvgElement("circle", {
      cx: 150,
      cy: 150,
      r: 116,
      fill: "url(#sauceGradient)"
    });

    ui.paintLayer.replaceChildren(sauceBase);

    step = "toppings";
    updateStep();
  }
}

ui.pizzaSurface.addEventListener("dragover", event => {
  if (step === "toppings") {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }
});

ui.pizzaSurface.addEventListener("drop", event => {
  event.preventDefault();

  if (step !== "toppings") return;

  const ingredientId = event.dataTransfer.getData("text/ingredient");

  if (ingredientId) {
    addIngredient(ingredientId);
  }
});

function addIngredient(ingredientId) {
  if (!gameStarted || gameFinished || step !== "toppings") return;

  const ingredient = orderIngredients.find(
    item => item.id === ingredientId
  );

  if (!ingredient) return;

  if (selectedIngredients.includes(ingredientId)) {
    ui.pizzaStatus.textContent =
      "Ese ingrediente ya está en tu pizza.";
    return;
  }

  selectedIngredients.push(ingredientId);

  for (let i = 0; i < 5; i++) {
    let x;
    let y;
    let distance;

    do {
      x = 50 + (Math.random() * 66 - 33);
      y = 50 + (Math.random() * 66 - 33);

      distance = Math.sqrt(
        (x - 50) ** 2 + (y - 50) ** 2
      );
    } while (distance > 39);

    const piece = createCell("span", ingredient.icon);

    piece.className = "topping-piece";
    piece.style.left = x + "%";
    piece.style.top = y + "%";

    ui.toppingsLayer.appendChild(piece);
  }

  score += 100;
  updateScore();

  ui.pizzaStatus.textContent =
    `¡Agregaste ${ingredient.name}!`;

  updateProgress();
  renderIngredients();

  if (selectedIngredients.length === orderIngredients.length) {
    step = "deliver";
    updateStep();

    ui.pizzaStatus.textContent =
      "¡Todos los ingredientes están en tu pizza! Ya puedes entregarla.";
  }
}

ui.pizzaCard.addEventListener("dragstart", event => {
  if (step !== "deliver") {
    event.preventDefault();
    return;
  }

  event.dataTransfer.setData("text/pizza", "ready");
  event.dataTransfer.effectAllowed = "move";
});

ui.dropZone.addEventListener("dragover", event => {
  if (step === "deliver") {
    event.preventDefault();
    ui.dropZone.classList.add("drag-over");
  }
});

ui.dropZone.addEventListener("dragleave", () => {
  ui.dropZone.classList.remove("drag-over");
});

ui.dropZone.addEventListener("drop", event => {
  event.preventDefault();

  ui.dropZone.classList.remove("drag-over");

  if (
    step === "deliver" &&
    event.dataTransfer.getData("text/pizza") === "ready"
  ) {
    deliverPizza();
  }
});

ui.deliverButton.addEventListener("click", deliverPizza);

function deliverPizza() {
  if (!gameStarted || gameFinished || step !== "deliver") return;

  step = "completed";

  ui.deliverButton.disabled = true;
  ui.pizzaCard.draggable = false;

  updateProgress();

  const bonus = remainingTime * 6;

  score += bonus;
  updateScore();

  levelsCompleted++;

  gameStarted = false;
  stopTimer();

  if (level >= TOTAL_LEVELS) {
    endGame(true);
    return;
  }

  level++;

  showMessage(
    "🍕 ¡Pedido entregado!",
    `Ganaste ${bonus} puntos extra. ¡Vamos al nivel ${level}!`,
    () => {
      gameStarted = true;
      startLevel();
      startTimer();
    }
  );
}

function showMessage(title, message, action) {
  ui.messageTitle.textContent = title;
  ui.messageText.textContent = message;

  modalAction = action;

  ui.messageModal.classList.remove("hidden");
}

ui.messageButton.addEventListener("click", () => {
  ui.messageModal.classList.add("hidden");

  const action = modalAction;
  modalAction = null;

  if (typeof action === "function") {
    action();
  }
});

function endGame(victory) {
  if (gameFinished) return;

  gameFinished = true;
  gameStarted = false;

  stopTimer();

  const elapsed = Math.floor(
    (Date.now() - startTimestamp) / 1000
  );

  saveResult(victory, elapsed);

  if (victory) {
    showMessage(
      "🏆 ¡Ganaste Pizza Hot!",
      `¡Felicidades, ${player}! Completaste los cinco niveles y conseguiste ${score} puntos.`,
      resetToIdleMode
    );
  } else {
    showMessage(
      "⏰ ¡Se terminó el tiempo!",
      `${player}, conseguiste ${score} puntos y completaste ${levelsCompleted} niveles.`,
      resetToIdleMode
    );
  }
}

function resetToIdleMode() {
  step = "idle";

  ui.stepDescription.textContent = "Esperando inicio...";
  ui.pizzaStatus.textContent =
    "Inicia una partida para comenzar a preparar.";

  renderIngredients();
}

/* ==========================================
   5. HISTORIAL Y RANKING DEL JUEGO
========================================== */

function getHistory() {
  try {
    const data = JSON.parse(
      localStorage.getItem("pizzaManiaHistorial")
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveResult(victory, elapsed) {
  const history = getHistory();

  history.push({
    nombre: player,
    puntuacion: score,
    fecha: new Date().toLocaleString("es-MX"),
    nivel: level,
    nivelesCompletados: levelsCompleted,
    tiempoJugado: elapsed,
    resultado: victory ? "Victoria" : "Tiempo agotado"
  });

  localStorage.setItem(
    "pizzaManiaHistorial",
    JSON.stringify(history)
  );

  renderRanking();
}

function renderRanking() {
  const history = getHistory()
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, 10);

  ui.rankingList.replaceChildren();

  if (history.length === 0) {
    const empty = createCell(
      "p",
      "Todavía no hay puntuaciones registradas."
    );

    empty.className = "empty-ranking";
    ui.rankingList.appendChild(empty);
    return;
  }

  history.forEach((result, index) => {
    const row = document.createElement("div");

    row.className = "ranking-item";

    const position = createCell(
      "span",
      "#" + (index + 1)
    );

    position.className = "ranking-position";

    const name = createCell("span", result.nombre);

    const points = createCell(
      "span",
      result.puntuacion + " pts"
    );

    points.className = "ranking-points";

    row.append(position, name, points);

    ui.rankingList.appendChild(row);
  });
}

ui.exportButton.addEventListener("click", () => {
  const history = getHistory();

  if (history.length === 0) {
    alert("Todavía no hay resultados para exportar.");
    return;
  }

  const blob = new Blob(
    [JSON.stringify(history, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "historial-pizza-mania.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
});

/* ==========================================
   6. INICIALIZACIÓN DEL SISTEMA
========================================== */

renderRanking();
updateTime();

loadIngredientsFromDB();
loadSalesHistory();
