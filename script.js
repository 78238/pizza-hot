/* ==========================================
   CONFIGURACIÓN DE SUPABASE
========================================== */
const SUPABASE_URL = "https://jomfuntsajqavrewccyx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_E8zDsiCI2JbAcwsSYS7JAg_g7Owt4DR";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ==========================================
   VARIABLES GLOBALES
========================================== */
let ingredients = [];
let allIngredientsDB = [];
let catalogPizzas = [];

const customers = [
  "Carlos", "María", "Sofía", "Diego",
  "Valentina", "Andrés", "Fernanda", "Luis"
];

const $ = id => document.getElementById(id);

const ui = {
  // Menú de Navegación
  menuSalesBtn: $("menuSalesBtn"),
  menuNewSaleBtn: $("menuNewSaleBtn"),
  menuIngredientsBtn: $("menuIngredientsBtn"),
  menuGameBtn: $("menuGameBtn"),

  // Vistas
  salesView: $("salesView"),
  ingredientsView: $("ingredientsView"),
  gameView: $("gameView"),

  // Ventas y KPIs
  salesTableBody: $("salesTableBody"),
  kpiTotalOrders: $("kpiTotalOrders"),
  kpiTotalRevenue: $("kpiTotalRevenue"),
  kpiTotalPizzas: $("kpiTotalPizzas"),
  refreshSalesBtn: $("refreshSalesBtn"),
  quickNewSaleBtn: $("quickNewSaleBtn"),

  // Modal Registrar Venta
  saleModal: $("saleModal"),
  closeSaleModalBtn: $("closeSaleModalBtn"),
  saleForm: $("saleForm"),
  salePizzaSelect: $("salePizzaSelect"),
  saleQuantity: $("saleQuantity"),
  saleTotalDisplay: $("saleTotalDisplay"),

  // Gestión de Ingredientes
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

// ==========================================
// NAVEGACIÓN DEL MENÚ PRINCIPAL
// ==========================================

function switchView(activeView, activeBtn) {
  // Ocultar todas las vistas
  ui.salesView.classList.add("hidden-view");
  ui.ingredientsView.classList.add("hidden-view");
  ui.gameView.classList.add("hidden-view");

  // Quitar estado activo de los botones del menú
  [ui.menuSalesBtn, ui.menuNewSaleBtn, ui.menuIngredientsBtn, ui.menuGameBtn].forEach(btn => {
    btn.classList.remove("active");
  });

  // Mostrar vista seleccionada
  activeView.classList.remove("hidden-view");
  if (activeBtn) activeBtn.classList.add("active");
}

ui.menuSalesBtn.addEventListener("click", async () => {
  switchView(ui.salesView, ui.menuSalesBtn);
  ui.levelLabel.textContent = "BASE DE DATOS ACTIVAQ";
  await loadSalesHistory();
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

// ==========================================
// 1. PANTALLA PRINCIPAL: VER VENTAS Y KPIs
// ==========================================

async function loadSalesHistory() {
  ui.salesTableBody.innerHTML = `<tr><td colspan="7">Consultando ventas en Supabase...</td></tr>`;

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
    ui.salesTableBody.innerHTML = `<tr><td colspan="7">Error al cargar ventas: ${error.message}</td></tr>`;
    return;
  }

  let totalOrders = data ? data.length : 0;
  let totalRevenue = 0;
  let totalPizzas = 0;

  if (!data || data.length === 0) {
    ui.kpiTotalOrders.textContent = "0";
    ui.kpiTotalRevenue.textContent = "$0.00";
    ui.kpiTotalPizzas.textContent = "0";
    ui.salesTableBody.innerHTML = `<tr><td colspan="7">Aún no hay ventas registradas. Haz clic en "💰 Registrar Venta".</td></tr>`;
    return;
  }

  ui.salesTableBody.innerHTML = "";

  data.forEach(pedido => {
    const fecha = pedido.fecha_hora
      ? new Date(pedido.fecha_hora).toLocaleString("es-MX")
      : "Sin fecha";

    const clienteNombre = pedido.datos_cliente?.nombre || "Mostrador";
    const clienteTel = pedido.datos_cliente?.telefono || "-";

    let totalVenta = 0;
    const detallesHtml = (pedido.pedido_pizza || []).map(det => {
      const subtotal = det.cantidad_pizzas * det.precio_momento;
      totalVenta += subtotal;
      totalPizzas += det.cantidad_pizzas;
      const pizzaNombre = det.pizzas?.nombre || "Pizza";
      return `${det.cantidad_pizzas}x ${pizzaNombre} ($${det.precio_momento} c/u)`;
    }).join("<br>");

    totalRevenue += totalVenta;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${pedido.folio_venta || pedido.identificacion}</strong></td>
      <td>${fecha}</td>
      <td>${clienteNombre}</td>
      <td>${clienteTel}</td>
      <td>${detallesHtml || "Sin detalle"}</td>
      <td><strong>$${totalVenta.toFixed(2)}</strong></td>
      <td><span class="badge-active">${pedido.estado_pedido || "Completado"}</span></td>
    `;
    ui.salesTableBody.appendChild(tr);
  });

  // Actualizar tarjetas KPI superiores
  ui.kpiTotalOrders.textContent = totalOrders;
  ui.kpiTotalRevenue.textContent = `$${totalRevenue.toFixed(2)}`;
  ui.kpiTotalPizzas.textContent = totalPizzas;
}

// ==========================================
// 2. REGISTRAR VENTA (datos_cliente -> pedidos -> pedido_pizza)
// ==========================================

async function loadPizzasCatalog() {
  const { data, error } = await supabaseClient
    .from("pizzas")
    .select("identificacion, nombre, tamano, precio");

  if (error) {
    console.error("Error cargando catálogo:", error.message);
    return;
  }

  catalogPizzas = data || [];
  ui.salePizzaSelect.innerHTML = "";

  if (catalogPizzas.length === 0) {
    ui.salePizzaSelect.innerHTML = `<option value="">No hay pizzas en la tabla 'pizzas'</option>`;
    return;
  }

  catalogPizzas.forEach(pizza => {
    const option = document.createElement("option");
    option.value = pizza.identificacion;
    option.textContent = `${pizza.nombre} (${pizza.tamano || "Estándar"}) - $${pizza.precio}`;
    option.dataset.precio = pizza.precio;
    ui.salePizzaSelect.appendChild(option);
  });

  updateSaleTotal();
}

function updateSaleTotal() {
  const selectedOption = ui.salePizzaSelect.selectedOptions[0];
  const price = selectedOption ? parseFloat(selectedOption.dataset.precio || 0) : 0;
  const qty = parseInt(ui.saleQuantity.value || 1, 10);
  ui.saleTotalDisplay.value = `$${(price * qty).toFixed(2)}`;
}

ui.salePizzaSelect.addEventListener("change", updateSaleTotal);
ui.saleQuantity.addEventListener("input", updateSaleTotal);

ui.saleForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const clientName = $("saleClientName").value.trim();
  const clientPhone = $("saleClientPhone").value.trim();
  const clientAddress = $("saleClientAddress").value.trim();
  const idPizza = parseInt(ui.salePizzaSelect.value, 10);
  const cantidad = parseInt(ui.saleQuantity.value, 10);

  if (!idPizza) {
    alert("Selecciona una pizza válida.");
    return;
  }

  const selectedPizza = catalogPizzas.find(p => p.identificacion === idPizza);
  const precioMomento = selectedPizza ? selectedPizza.precio : 0;

  try {
    const { data: clienteData, error: clienteError } = await supabaseClient
      .from("datos_cliente")
      .insert([{
        nombre: clientName,
        telefono: clientPhone ? parseInt(clientPhone, 10) : null,
        direccion: clientAddress || null
      }])
      .select("identificacion")
      .single();

    if (clienteError) throw new Error("Cliente: " + clienteError.message);

    const folioGenerado = Math.floor(100000 + Math.random() * 900000);
    const { data: pedidoData, error: pedidoError } = await supabaseClient
      .from("pedidos")
      .insert([{
        id_cliente: clienteData.identificacion,
        folio_venta: folioGenerado,
        estado_pedido: "Completado"
      }])
      .select("identificacion")
      .single();

    if (pedidoError) throw new Error("Pedido: " + pedidoError.message);

    const { error: detalleError } = await supabaseClient
      .from("pedido_pizza")
      .insert([{
        id_pedido: pedidoData.identificacion,
        id_pizza: idPizza,
        cantidad_pizzas: cantidad,
        precio_momento: precioMomento
      }]);

    if (detalleError) throw new Error("Detalle: " + detalleError.message);

    alert(`✅ Venta registrada.\nFolio: #${folioGenerado}\nTotal: $${precioMomento * cantidad}`);
    ui.saleForm.reset();
    ui.saleModal.classList.add("hidden");

    // Volver a la vista de ventas y actualizar tabla
    switchView(ui.salesView, ui.menuSalesBtn);
    await loadSalesHistory();

  } catch (err) {
    alert("❌ Error al registrar venta: " + err.message);
  }
});

// ==========================================
// 3. GESTIÓN DE INGREDIENTES (VER, CREAR, EDITAR)
// ==========================================

async function loadIngredientsFromDB() {
  const { data, error } = await supabaseClient
    .from("ingredientes")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error cargando ingredientes:", error.message);
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
  ui.ingredientsTableBody.innerHTML = "";

  if (allIngredientsDB.length === 0) {
    ui.ingredientsTableBody.innerHTML = `<tr><td colspan="7">No hay ingredientes registrados.</td></tr>`;
    return;
  }

  allIngredientsDB.forEach(ing => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ing.id}</td>
      <td style="font-size: 1.3rem;">${ing.icono || "🍕"}</td>
      <td><strong>${ing.nombre}</strong></td>
      <td>${ing.categoria}</td>
      <td>$${Number(ing.precio).toFixed(2)}</td>
      <td>
        <span class="${ing.activo ? "badge-active" : "badge-inactive"}">
          ${ing.activo ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td style="display: flex; gap: 6px;">
        <button type="button" class="btn-sm btn-edit" onclick="editIngredient(${ing.id})">✏️ Editar</button>
        <button type="button" class="btn-sm btn-toggle" onclick="toggleIngredientStatus(${ing.id}, ${ing.activo})">
          ${ing.activo ? "Desactivar" : "Activar"}
        </button>
      </td>
    `;
    ui.ingredientsTableBody.appendChild(tr);
  });
}

window.editIngredient = function(id) {
  const ing = allIngredientsDB.find(item => item.id === id);
  if (!ing) return;

  $("ingId").value = ing.id;
  $("ingNombre").value = ing.nombre;
  $("ingCategoria").value = ing.categoria;
  $("ingPrecio").value = ing.precio;
  $("ingIcono").value = ing.icono || "🍕";

  ui.saveIngBtn.textContent = "💾 Guardar Cambios";
  ui.cancelEditIngBtn.classList.remove("hidden");
  $("ingNombre").focus();
};

function resetIngredientForm() {
  ui.ingredientForm.reset();
  $("ingId").value = "";
  $("ingIcono").value = "🍕";
  ui.saveIngBtn.textContent = "➕ Agregar Ingrediente";
  ui.cancelEditIngBtn.classList.add("hidden");
}

ui.cancelEditIngBtn.addEventListener("click", resetIngredientForm);

window.toggleIngredientStatus = async function(id, currentStatus) {
  const { error } = await supabaseClient
    .from("ingredientes")
    .update({ activo: !currentStatus })
    .eq("id", id);

  if (error) {
    alert("Error al cambiar estado: " + error.message);
    return;
  }
  await loadIngredientsFromDB();
};

ui.ingredientForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = $("ingId").value;
  const nombre = $("ingNombre").value.trim();
  const categoria = $("ingCategoria").value;
  const precio = parseFloat($("ingPrecio").value);
  const icono = $("ingIcono").value.trim() || "🍕";

  if (id) {
    const { error } = await supabaseClient
      .from("ingredientes")
      .update({ nombre, categoria, precio, icono })
      .eq("id", parseInt(id, 10));

    if (error) {
      alert("Error al actualizar ingrediente: " + error.message);
      return;
    }
    alert(`✅ Ingrediente "${nombre}" actualizado.`);
  } else {
    const { error } = await supabaseClient
      .from("ingredientes")
      .insert([{ nombre, categoria, precio, icono, activo: true }]);

    if (error) {
      alert("Error al registrar ingrediente: " + error.message);
      return;
    }
    alert(`✅ Ingrediente "${nombre}" registrado.`);
  }

  resetIngredientForm();
  await loadIngredientsFromDB();
});

// ==========================================
// 4. LÓGICA DEL JUEGO (JUGAR TURNO)
// ==========================================

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
    if (remainingTime === 0) endGame(false);
  }, 1000);
}

ui.startNewGameBtn.addEventListener("click", () => {
  if (ingredients.length === 0) {
    alert("Agrega al menos un ingrediente activo en 'Gestionar Ingredientes' antes de jugar.");
    return;
  }
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
  const ingredientCount = Math.min(ingredients.length, level <= 3 ? 3 : 5);
  orderIngredients = shuffle(ingredients).slice(0, ingredientCount);

  ui.customerName.textContent = randomItem(customers);
  ui.customerOrder.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = "Pizza especial";
  ui.customerOrder.appendChild(title);

  orderIngredients.forEach(ingredient => {
    const line = document.createElement("div");
    line.textContent = `${ingredient.icon} ${ingredient.name}`;
    ui.customerOrder.appendChild(line);
  });

  const note = document.createElement("small");
  note.textContent = "¡No olvides ningún ingrediente!";
  ui.customerOrder.appendChild(note);
}

function renderIngredients() {
  ui.ingredientsGrid.replaceChildren();

  ingredients.forEach(ingredient => {
    const button = document.createElement("button");
    button.className = "ingredient";
    button.type = "button";

    const icon = document.createElement("span");
    icon.className = "ingredient-icon";
    icon.textContent = ingredient.icon;

    const name = document.createElement("span");
    name.className = "ingredient-name";
    name.textContent = ingredient.name;

    button.append(icon, name);

    const required = orderIngredients.some(item => item.id === ingredient.id);
    const alreadyAdded = selectedIngredients.includes(ingredient.id);

    button.disabled = gameStarted ? (step !== "toppings" || !required || alreadyAdded) : true;
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
      if (!button.disabled) addIngredient(ingredient.id);
    });

    ui.ingredientsGrid.appendChild(button);
  });
}

function updateStep() {
  if (step === "dough") {
    ui.stepDescription.textContent = "1. Preparar la masa";
    ui.pizzaStatus.textContent = "Mantén presionado y mueve el cursor sobre la masa.";
  }
  if (step === "sauce") {
    ui.stepDescription.textContent = "2. Agregar salsa";
    ui.pizzaStatus.textContent = "Extiende la salsa roja sobre la pizza.";
  }
  if (step === "toppings") {
    ui.stepDescription.textContent = "3. Agregar ingredientes";
    ui.pizzaStatus.textContent = "Arrastra o selecciona los ingredientes del pedido.";
  }
  if (step === "deliver") {
    ui.stepDescription.textContent = "4. Entregar pizza";
    ui.pizzaStatus.textContent = "¡Pizza lista! Entrégala al cliente.";
    ui.pizzaCard.draggable = true;
    ui.deliverButton.disabled = false;
  }
  renderIngredients();
  updateProgress();
}

function updateProgress() {
  let progress = 0;
  if (step === "dough") progress = 25 * Math.min(1, paintedCells.size / PAINT_TARGET);
  if (step === "sauce") progress = 25 + 25 * Math.min(1, paintedCells.size / PAINT_TARGET);
  if (step === "toppings") progress = 50 + 40 * (selectedIngredients.length / orderIngredients.length);
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
  if ((step !== "dough" && step !== "sauce") || !isInsidePizza(x, y)) return;

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

  if (paintedCells.size >= PAINT_TARGET) finishPaintingStep();
}

function paintMovement(event) {
  if (!drawing) return;
  const point = getPizzaPoint(event);

  if (lastPaintPoint) {
    const distance = Math.hypot(point.x - lastPaintPoint.x, point.y - lastPaintPoint.y);
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
  if (!gameStarted || gameFinished || (step !== "dough" && step !== "sauce")) return;
  event.preventDefault();
  drawing = true;
  lastPaintPoint = null;
  ui.pizzaSurface.setPointerCapture(event.pointerId);
  paintMovement(event);
});

ui.pizzaSurface.addEventListener("pointermove", paintMovement);
ui.pizzaSurface.addEventListener("pointerup", () => { drawing = false; lastPaintPoint = null; });
ui.pizzaSurface.addEventListener("pointercancel", () => { drawing = false; lastPaintPoint = null; });

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
  if (ingredientId) addIngredient(ingredientId);
});

function addIngredient(ingredientId) {
  if (!gameStarted || gameFinished || step !== "toppings") return;
  const ingredient = orderIngredients.find(item => item.id === ingredientId);
  if (!ingredient) return;

  if (selectedIngredients.includes(ingredientId)) {
    ui.pizzaStatus.textContent = "Ese ingrediente ya está en tu pizza.";
    return;
  }

  selectedIngredients.push(ingredientId);

  for (let i = 0; i < 5; i++) {
    let x, y, distance;
    do {
      x = 50 + (Math.random() * 66 - 33);
      y = 50 + (Math.random() * 66 - 33);
      distance = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2);
    } while (distance > 39);

    const piece = document.createElement("span");
    piece.className = "topping-piece";
    piece.textContent = ingredient.icon;
    piece.style.left = x + "%";
    piece.style.top = y + "%";
    ui.toppingsLayer.appendChild(piece);
  }

  score += 100;
  updateScore();
  ui.pizzaStatus.textContent = `¡Agregaste ${ingredient.name}!`;
  updateProgress();
  renderIngredients();

  if (selectedIngredients.length === orderIngredients.length) {
    step = "deliver";
    updateStep();
    ui.pizzaStatus.textContent = "¡Todos los ingredientes están en tu pizza! Ya puedes entregarla.";
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

ui.dropZone.addEventListener("dragleave", () => ui.dropZone.classList.remove("drag-over"));

ui.dropZone.addEventListener("drop", event => {
  event.preventDefault();
  ui.dropZone.classList.remove("drag-over");
  if (step === "deliver" && event.dataTransfer.getData("text/pizza") === "ready") {
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
  if (typeof action === "function") action();
});

function endGame(victory) {
  if (gameFinished) return;
  gameFinished = true;
  gameStarted = false;
  stopTimer();

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
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
  ui.pizzaStatus.textContent = "Inicia una partida para comenzar a preparar.";
  renderIngredients();
}

function getHistory() {
  try {
    const data = JSON.parse(localStorage.getItem("pizzaManiaHistorial"));
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
  localStorage.setItem("pizzaManiaHistorial", JSON.stringify(history));
  renderRanking();
}

function renderRanking() {
  const history = getHistory().sort((a, b) => b.puntuacion - a.puntuacion).slice(0, 10);
  ui.rankingList.replaceChildren();

  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-ranking";
    empty.textContent = "Todavía no hay puntuaciones registradas.";
    ui.rankingList.appendChild(empty);
    return;
  }

  history.forEach((result, index) => {
    const row = document.createElement("div");
    row.className = "ranking-item";
    row.innerHTML = `
      <span class="ranking-position">#${index + 1}</span>
      <span>${result.nombre}</span>
      <span class="ranking-points">${result.puntuacion} pts</span>
    `;
    ui.rankingList.appendChild(row);
  });
}

ui.exportButton.addEventListener("click", () => {
  const history = getHistory();
  if (history.length === 0) {
    alert("Todavía no hay resultados para exportar.");
    return;
  }
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "historial-pizza-mania.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

// ==========================================
// INICIALIZACIÓN (ARRANCA DIRECTO EN VENTAS)
// ==========================================
renderRanking();
updateTime();
loadIngredientsFromDB();
loadSalesHistory();