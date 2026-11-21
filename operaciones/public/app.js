// Kinetix Operaciones · interfaz (JS sin dependencias ni build).
// Toda regla de negocio vive en el servidor; aquí solo se muestra y se envía.

const LABELS = {
  status: { nuevo: "Nuevo", confirmado: "Confirmado", pagado: "Pagado", enviado: "Enviado", entregado: "Entregado", cancelado: "Cancelado" },
  pay: { yape_plin: "Yape / Plin", transferencia: "Transferencia", efectivo_contra_entrega: "Contra entrega" },
  channel: { web: "Web", whatsapp: "WhatsApp", instagram: "Instagram", presencial: "Presencial", otro: "Otro" },
  move: { entrada: "Entrada", salida_pedido: "Salida (pedido)", liberacion_pedido: "Liberado (cancelación)", ajuste: "Ajuste" },
  action: { confirmado: "Confirmar", pagado: "Marcar pagado", enviado: "Marcar enviado", entregado: "Marcar entregado", cancelado: "Cancelar pedido" },
};

const $ = (sel, root = document) => root.querySelector(sel);
const view = $("#view");
const drawer = $("#drawer");

/** Escapa texto antes de insertarlo como HTML (previene XSS). */
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (c) => "S/ " + (c / 100).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toCents = (soles) => Math.round(Number(soles || 0) * 100);
const date = (iso) => new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
const badge = (s) => `<span class="badge s-${esc(s)}">${esc(LABELS.status[s] ?? s)}</span>`;

// ---------- Operador (queda en el historial de cada cambio) ----------
const opInput = $("#operator");
try { opInput.value = localStorage.getItem("kx-operador") ?? ""; } catch {}
opInput.addEventListener("change", () => { try { localStorage.setItem("kx-operador", opInput.value.trim()); } catch {} });

// ---------- Cliente HTTP ----------
class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? `Error ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function api(method, url, body, headers = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      "x-operador": encodeURIComponent(opInput.value.trim() || "anónimo"),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

function toast(msg, kind = "info") {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = msg;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), kind === "error" ? 7000 : 3500);
}

function explain(err) {
  if (!(err instanceof ApiError)) return "No se pudo conectar con el servidor. ¿Está corriendo?";
  const d = err.body?.error?.details;
  if (err.body?.error?.code === "STOCK_INSUFICIENTE" && Array.isArray(d))
    return err.message + ": " + d.map((x) => `${x.sku} (pides ${x.requested}, hay ${x.available})`).join(", ");
  if (err.body?.error?.code === "VALIDACION" && d && typeof d === "object")
    return "Revisa: " + Object.entries(d).map(([k, v]) => `${k} → ${[].concat(v).join(", ")}`).join("; ");
  return err.message;
}

const fail = (err) => toast(explain(err), "error");

/** Ajusta anchos de barras sin estilos en línea (la CSP los bloquea). */
const paintBars = (root) => root.querySelectorAll("[data-w]").forEach((el) => (el.style.width = el.dataset.w + "%"));

// ---------- Router ----------
let meta = null;
const routes = { pedidos: renderOrders, nuevo: renderNewOrder, inventario: renderInventory, clientes: renderCustomers, resumen: renderSummary };

async function route() {
  const name = location.hash.replace(/^#\/?/, "").split("?")[0] || "pedidos";
  const fn = routes[name] ?? renderOrders;
  document.querySelectorAll("#nav a").forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === `#/${name}`));
  document.querySelectorAll("#nav a[aria-current]").forEach((a) => a.setAttribute("aria-current", "page"));
  view.innerHTML = `<p class="muted">Cargando…</p>`;
  try {
    meta ??= await api("GET", "/api/meta");
    await fn();
  } catch (err) {
    view.innerHTML = `<div class="card empty">${esc(explain(err))}</div>`;
  }
}
addEventListener("hashchange", route);

// ---------- Pedidos ----------
const orderFilter = { status: "", search: "" };

async function renderOrders() {
  view.innerHTML = `
    <div class="row"><h1>Pedidos</h1><span class="spacer"></span>
      <a class="btn" id="csv" href="#">Exportar CSV</a>
      <a class="btn primary" href="#/nuevo">+ Nuevo pedido</a></div>
    <div class="row">
      <div class="chips" id="chips">
        ${["", ...meta.statuses].map((s) => `<button class="chip" data-s="${s}" aria-pressed="${orderFilter.status === s}">${s ? esc(LABELS.status[s]) : "Todos"}</button>`).join("")}
      </div>
      <span class="spacer"></span>
      <input id="search" type="search" placeholder="Buscar código, cliente, teléfono, distrito" value="${esc(orderFilter.search)}" />
    </div>
    <div id="list"></div>`;
  $("#search").style.maxWidth = "340px";
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]");
    if (!b) return;
    orderFilter.status = b.dataset.s;
    document.querySelectorAll("#chips .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
    loadOrders();
  });
  let t;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => { orderFilter.search = e.target.value; loadOrders(); }, 250);
  });
  $("#csv").addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "/api/orders/export.csv?" + filterQuery();
  });
  await loadOrders();
}

const filterQuery = () => new URLSearchParams(Object.entries(orderFilter).filter(([, v]) => v)).toString();

async function loadOrders() {
  const list = $("#list");
  if (!list) return;
  const page = await api("GET", "/api/orders?limit=200&" + filterQuery()).catch((e) => (fail(e), null));
  if (!page) return;
  if (!page.items.length) {
    list.innerHTML = `<div class="card empty">No hay pedidos con este filtro.</div>`;
    return;
  }
  list.innerHTML = `
    <p class="muted">${page.total} pedido(s)</p>
    <div class="tablewrap"><table>
      <thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Distrito</th><th>Productos</th><th>Pago</th><th>Estado</th><th class="num">Total</th></tr></thead>
      <tbody>${page.items.map((o) => `
        <tr class="click" data-id="${esc(o.id)}" tabindex="0">
          <td><strong>${esc(o.code)}</strong></td>
          <td>${date(o.createdAt)}</td>
          <td>${esc(o.customerName)}<br><span class="muted">${esc(o.phone)}</span></td>
          <td>${esc(o.district)}</td>
          <td>${o.lines.map((l) => `${l.quantity}× ${esc(l.productName)} ${esc(l.flavor)}`).join("<br>")}</td>
          <td>${esc(LABELS.pay[o.paymentMethod])}</td>
          <td>${badge(o.status)}</td>
          <td class="num">${money(o.totalCents)}</td>
        </tr>`).join("")}</tbody>
    </table></div>`;
  list.querySelectorAll("tr[data-id]").forEach((tr) => {
    const open = () => openOrder(tr.dataset.id);
    tr.addEventListener("click", open);
    tr.addEventListener("keydown", (e) => e.key === "Enter" && open());
  });
}

async function openOrder(id) {
  let o;
  try { o = await api("GET", `/api/orders/${encodeURIComponent(id)}`); } catch (e) { return fail(e); }
  const editable = o.status !== "entregado" && o.status !== "cancelado";
  drawer.innerHTML = `
    <div class="dhead"><h2>${esc(o.code)}</h2>${badge(o.status)}<span class="spacer"></span>
      <button class="btn" data-close>Cerrar</button></div>
    <div class="dbody">
      <div class="grid g2">
        <div><h2>Cliente</h2>${esc(o.customerName)}<br>
          <a href="https://wa.me/51${esc(o.phone)}" target="_blank" rel="noopener noreferrer">${esc(o.phone)}</a>${o.email ? `<br>${esc(o.email)}` : ""}
          <p class="muted">${esc(LABELS.channel[o.channel])} · ${esc(LABELS.pay[o.paymentMethod])}</p></div>
        <div><h2>Entrega</h2>${esc(o.address)}<br>${esc(o.district)}${o.reference ? `<br><span class="muted">Ref: ${esc(o.reference)}</span>` : ""}
          ${o.notes ? `<p class="muted">Nota: ${esc(o.notes)}</p>` : ""}</div>
      </div>
      <div class="tablewrap"><table>
        <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Total</th></tr></thead>
        <tbody>${o.lines.map((l) => `<tr><td>${esc(l.productName)} ${esc(l.flavor)} <code class="muted">${esc(l.sku)}</code></td>
          <td class="num">${l.quantity}</td><td class="num">${money(l.unitPriceCents)}</td><td class="num">${money(l.lineTotalCents)}</td></tr>`).join("")}</tbody>
        <tfoot class="totals">
          <tr><td colspan="3" class="num muted">Subtotal</td><td class="num">${money(o.subtotalCents)}</td></tr>
          ${o.discountCents ? `<tr><td colspan="3" class="num muted">Descuento</td><td class="num">− ${money(o.discountCents)}</td></tr>` : ""}
          ${o.shippingCents ? `<tr><td colspan="3" class="num muted">Envío</td><td class="num">${money(o.shippingCents)}</td></tr>` : ""}
          <tr><td colspan="3" class="num"><strong>Total</strong></td><td class="num"><strong>${money(o.totalCents)}</strong></td></tr>
        </tfoot>
      </table></div>
      ${o.allowedTransitions.length ? `
      <div class="card"><h2>Siguiente paso</h2>
        <label class="f"><span>Nota (opcional; obligatoria para cancelar)</span><input id="note" maxlength="500" /></label>
        <div class="row" id="actions">${o.allowedTransitions.map((s) =>
          `<button class="btn ${s === "cancelado" ? "danger" : "primary"}" data-to="${s}">${esc(LABELS.action[s])}</button>`).join("")}</div>
      </div>` : ""}
      ${editable ? `
      <details class="card"><summary>Editar datos de entrega</summary>
        <form id="edit" class="form">
          <label class="f"><span>Dirección</span><input name="address" required maxlength="200" value="${esc(o.address)}" /></label>
          <label class="f"><span>Distrito</span><input name="district" required maxlength="80" list="districts" value="${esc(o.district)}" /></label>
          <label class="f"><span>Referencia</span><input name="reference" maxlength="200" value="${esc(o.reference)}" /></label>
          <label class="f"><span>Notas</span><input name="notes" maxlength="1000" value="${esc(o.notes)}" /></label>
          <div><button class="btn">Guardar cambios</button></div>
        </form>
        <datalist id="districts">${meta.districts.map((d) => `<option value="${esc(d)}">`).join("")}</datalist>
      </details>` : ""}
      <div><h2>Historial</h2><ul class="timeline">${o.history.map((h) =>
        `<li>${date(h.at)} · ${h.from && h.from !== h.to ? `${esc(LABELS.status[h.from])} → ` : ""}<strong>${esc(LABELS.status[h.to])}</strong>
         · <span class="muted">${esc(h.actor)}</span>${h.note ? `<br><span class="muted">${esc(h.note)}</span>` : ""}</li>`).join("")}</ul></div>
    </div>`;
  drawer.querySelector("[data-close]").onclick = () => drawer.close();
  drawer.querySelector("#actions")?.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-to]");
    if (!b) return;
    const note = $("#note", drawer).value.trim();
    if (b.dataset.to === "cancelado") {
      if (!note) return toast("Escribe el motivo de la cancelación en la nota.", "error");
      if (!confirm(`¿Cancelar ${o.code}? El stock se devolverá al inventario.`)) return;
    }
    b.disabled = true;
    try {
      await api("POST", `/api/orders/${o.id}/status`, { to: b.dataset.to, expectedVersion: o.version, note: note || null });
      toast(`${o.code}: ${LABELS.status[b.dataset.to]}`);
      await openOrder(o.id);
      loadOrders();
    } catch (err) {
      fail(err);
      if (err.status === 409) openOrder(o.id);
      b.disabled = false;
    }
  });
  drawer.querySelector("#edit")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      await api("PATCH", `/api/orders/${o.id}`, { expectedVersion: o.version, ...f });
      toast("Datos actualizados");
      await openOrder(o.id);
      loadOrders();
    } catch (err) { fail(err); }
  });
  if (!drawer.open) drawer.showModal();
}

// ---------- Nuevo pedido ----------
async function renderNewOrder() {
  const catalog = await api("GET", "/api/catalog");
  const skus = catalog.flatMap((p) =>
    p.active ? p.variants.filter((v) => v.active).map((v) => ({ ...v, name: `${p.name} ${v.flavor}`, priceCents: p.priceCents })) : [],
  );
  // Una clave por intento de envío: si se hace doble clic o se reintenta, no se duplica el pedido.
  let idemKey = crypto.randomUUID();

  view.innerHTML = `
    <h1>Nuevo pedido</h1>
    <form id="nf" class="grid" novalidate>
      <div class="card"><h2>Cliente</h2><div class="form">
        <label class="f"><span>Nombre <b>*</b></span><input name="name" required maxlength="120" autocomplete="off" /></label>
        <label class="f"><span>Teléfono / WhatsApp <b>*</b></span><input name="phone" required inputmode="tel" minlength="7" maxlength="20" /></label>
        <label class="f"><span>Correo</span><input name="email" type="email" /></label>
        <label class="f"><span>Canal</span><select name="channel">${meta.channels.map((c) => `<option value="${c}" ${c === "whatsapp" ? "selected" : ""}>${esc(LABELS.channel[c])}</option>`).join("")}</select></label>
      </div></div>
      <div class="card"><h2>Entrega</h2><div class="form">
        <label class="f"><span>Dirección <b>*</b></span><input name="address" required maxlength="200" /></label>
        <label class="f"><span>Distrito <b>*</b></span><input name="district" required list="dl" maxlength="80" /></label>
        <label class="f"><span>Referencia</span><input name="reference" maxlength="200" /></label>
        <label class="f"><span>Pago <b>*</b></span><select name="paymentMethod">${meta.paymentMethods.map((p) => `<option value="${p}">${esc(LABELS.pay[p])}</option>`).join("")}</select></label>
      </div><datalist id="dl">${meta.districts.map((d) => `<option value="${esc(d)}">`).join("")}</datalist></div>
      <div class="card"><div class="row"><h2>Productos</h2><span class="spacer"></span><button type="button" class="btn sm" id="add">+ Agregar producto</button></div>
        <div class="tablewrap"><table><thead><tr><th>Producto</th><th class="num">Stock</th><th class="num">Precio</th><th class="num">Cant.</th><th class="num">Subtotal</th><th></th></tr></thead>
        <tbody id="lines"></tbody></table></div>
        <div class="form" id="extras">
          <label class="f"><span>Envío (S/)</span><input name="shipping" type="number" min="0" step="0.5" value="0" /></label>
          <label class="f"><span>Descuento (S/)</span><input name="discount" type="number" min="0" step="0.5" value="0" /></label>
          <label class="f"><span>Notas internas</span><input name="notes" maxlength="1000" /></label>
        </div>
        <p class="row"><span class="spacer"></span><strong id="total">Total: S/ 0.00</strong></p>
      </div>
      <p class="err" id="formerr"></p>
      <div class="row"><span class="spacer"></span><a class="btn" href="#/pedidos">Cancelar</a><button class="btn primary" id="submit">Registrar pedido</button></div>
    </form>`;

  const form = $("#nf");
  const lines = $("#lines");
  $("#extras").style.marginTop = "12px";

  const addLine = (sku = "") => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><select name="sku" required><option value="">Elegir…</option>${skus.map((s) =>
        `<option value="${esc(s.sku)}" ${s.sku === sku ? "selected" : ""} ${s.stock === 0 ? "disabled" : ""}>${esc(s.name)}${s.stock === 0 ? " (agotado)" : ""}</option>`).join("")}</select></td>
      <td class="num" data-stock>—</td><td class="num" data-price>—</td>
      <td class="num"><input name="qty" type="number" min="1" value="1" /></td>
      <td class="num" data-sub>—</td>
      <td><button type="button" class="btn sm danger" aria-label="Quitar">✕</button></td>`;
    tr.querySelector('[name="qty"]').style.width = "72px";
    tr.querySelector("button").onclick = () => { tr.remove(); recalc(); };
    lines.append(tr);
    recalc();
  };

  const recalc = () => {
    let subtotal = 0;
    lines.querySelectorAll("tr").forEach((tr) => {
      const s = skus.find((x) => x.sku === tr.querySelector('[name="sku"]').value);
      const qty = Math.max(0, parseInt(tr.querySelector('[name="qty"]').value, 10) || 0);
      tr.querySelector("[data-stock]").textContent = s ? s.stock : "—";
      tr.querySelector("[data-stock]").className = "num" + (s && qty > s.stock ? " low" : "");
      tr.querySelector("[data-price]").textContent = s ? money(s.priceCents) : "—";
      tr.querySelector("[data-sub]").textContent = s ? money(s.priceCents * qty) : "—";
      if (s) subtotal += s.priceCents * qty;
    });
    const total = subtotal + toCents(form.shipping.value) - toCents(form.discount.value);
    $("#total").textContent = `Total: ${money(Math.max(0, total))}`;
  };

  form.addEventListener("input", recalc);
  form.addEventListener("change", recalc);
  $("#add").onclick = () => addLine();
  addLine();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#formerr").textContent = "";
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const items = [...lines.querySelectorAll("tr")]
      .map((tr) => ({ sku: tr.querySelector('[name="sku"]').value, quantity: parseInt(tr.querySelector('[name="qty"]').value, 10) }))
      .filter((i) => i.sku && i.quantity > 0);
    if (!items.length) return ($("#formerr").textContent = "Agrega al menos un producto.");
    const f = form.elements;
    const body = {
      customer: { name: f.name.value, phone: f.phone.value, email: f.email.value || null },
      address: f.address.value,
      district: f.district.value,
      reference: f.reference.value || null,
      channel: f.channel.value,
      paymentMethod: f.paymentMethod.value,
      items,
      shippingCents: toCents(f.shipping.value),
      discountCents: toCents(f.discount.value),
      notes: f.notes.value || null,
    };
    const btn = $("#submit");
    btn.disabled = true;
    try {
      const o = await api("POST", "/api/orders", body, { "idempotency-key": idemKey });
      idemKey = crypto.randomUUID();
      toast(`Pedido ${o.code} registrado · ${money(o.totalCents)}`);
      location.hash = "#/pedidos";
      setTimeout(() => openOrder(o.id), 50);
    } catch (err) {
      $("#formerr").textContent = explain(err);
      btn.disabled = false;
    }
  });
}

// ---------- Inventario ----------
async function renderInventory() {
  const [catalog, movements] = await Promise.all([api("GET", "/api/catalog"), api("GET", "/api/movements?limit=30")]);
  view.innerHTML = `
    <h1>Inventario</h1>
    <div class="tablewrap"><table>
      <thead><tr><th>Producto</th><th>SKU</th><th class="num">Precio</th><th class="num">Stock</th><th class="num">Mínimo</th><th>Estado</th><th></th></tr></thead>
      <tbody>${catalog.map((p) => p.variants.map((v, i) => `
        <tr>
          <td>${i === 0 ? `<strong>${esc(p.name)}</strong> <span class="muted">${esc(p.size)}</span><br>` : ""}${esc(v.flavor)}</td>
          <td><code>${esc(v.sku)}</code></td>
          <td class="num">${i === 0 ? `<button class="btn sm" data-price="${esc(p.id)}" data-cur="${p.priceCents}">${money(p.priceCents)}</button>` : ""}</td>
          <td class="num ${v.lowStock ? "low" : ""}">${v.stock}${v.lowStock ? " ⚠" : ""}</td>
          <td class="num"><button class="btn sm" data-reorder="${esc(v.sku)}" data-cur="${v.reorderLevel}">${v.reorderLevel}</button></td>
          <td>${v.active && p.active ? "Activo" : `<span class="muted">Inactivo</span>`}</td>
          <td class="row"><button class="btn sm primary" data-move="entrada" data-sku="${esc(v.sku)}">+ Ingreso</button>
            <button class="btn sm" data-move="ajuste" data-sku="${esc(v.sku)}">Ajustar</button></td>
        </tr>`).join("")).join("")}</tbody>
    </table></div>
    <h2 class="mt">Últimos movimientos</h2>
    <div class="tablewrap"><table>
      <thead><tr><th>Fecha</th><th>SKU</th><th>Tipo</th><th class="num">Cant.</th><th class="num">Stock final</th><th>Motivo</th><th>Usuario</th></tr></thead>
      <tbody>${movements.map((m) => `<tr><td>${date(m.at)}</td><td><code>${esc(m.sku)}</code></td><td>${esc(LABELS.move[m.type])}</td>
        <td class="num">${m.quantity > 0 ? "+" : ""}${m.quantity}</td><td class="num">${m.stockAfter}</td>
        <td>${esc(m.reason)}${m.orderCode ? ` · ${esc(m.orderCode)}` : ""}</td><td>${esc(m.actor)}</td></tr>`).join("")}</tbody>
    </table></div>`;
  view.querySelector("h2.mt").style.marginTop = "24px";

  view.onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    try {
      if (b.dataset.move) {
        const entrada = b.dataset.move === "entrada";
        const q = prompt(entrada ? `Unidades que ingresan de ${b.dataset.sku}:` : `Ajuste para ${b.dataset.sku} (ej. -2 por merma, 3 por conteo):`);
        if (q === null) return;
        const reason = prompt("Motivo:", entrada ? "Compra a proveedor" : "Conteo físico");
        if (reason === null) return;
        await api("POST", `/api/variants/${encodeURIComponent(b.dataset.sku)}/movements`, { type: b.dataset.move, quantity: parseInt(q, 10), reason });
        toast("Stock actualizado");
      } else if (b.dataset.price) {
        const v = prompt("Nuevo precio en soles (no afecta pedidos ya registrados):", (b.dataset.cur / 100).toFixed(2));
        if (v === null) return;
        await api("PATCH", `/api/products/${encodeURIComponent(b.dataset.price)}`, { priceCents: toCents(v) });
        toast("Precio actualizado");
      } else if (b.dataset.reorder) {
        const v = prompt("Stock mínimo para alertar reposición:", b.dataset.cur);
        if (v === null) return;
        await api("PATCH", `/api/variants/${encodeURIComponent(b.dataset.reorder)}`, { reorderLevel: parseInt(v, 10) });
        toast("Mínimo actualizado");
      } else return;
      renderInventory();
    } catch (err) { fail(err); }
  };
}

// ---------- Clientes ----------
async function renderCustomers() {
  const list = await api("GET", "/api/customers");
  view.innerHTML = `
    <h1>Clientes</h1>
    ${list.length ? `<div class="tablewrap"><table>
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Correo</th><th class="num">Pedidos</th><th class="num">Compras</th><th>Último pedido</th></tr></thead>
      <tbody>${list.map((c) => `<tr><td>${esc(c.name)}</td>
        <td><a href="https://wa.me/51${esc(c.phone)}" target="_blank" rel="noopener noreferrer">${esc(c.phone)}</a></td>
        <td>${esc(c.email ?? "")}</td><td class="num">${c.orders}</td><td class="num">${money(c.spentCents)}</td>
        <td>${c.lastOrderAt ? date(c.lastOrderAt) : "—"}</td></tr>`).join("")}</tbody>
    </table></div>` : `<div class="card empty">Aún no hay clientes. Se crean solos al registrar pedidos.</div>`}`;
}

// ---------- Resumen ----------
async function renderSummary() {
  const s = await api("GET", "/api/reports/summary");
  const maxUnits = Math.max(1, ...s.unitsBySku.map((u) => u.units));
  const active = s.ordersByStatus.nuevo + s.ordersByStatus.confirmado + s.ordersByStatus.pagado + s.ordersByStatus.enviado;
  view.innerHTML = `
    <h1>Resumen</h1>
    <div class="grid g4">
      <div class="card kpi"><div class="l">Ventas (pagado, enviado, entregado)</div><div class="v">${money(s.revenueCents)}</div></div>
      <div class="card kpi"><div class="l">Por cobrar</div><div class="v">${money(s.pendingCollectionCents)}</div></div>
      <div class="card kpi"><div class="l">Ticket promedio</div><div class="v">${money(s.averageTicketCents)}</div></div>
      <div class="card kpi"><div class="l">Pedidos en curso</div><div class="v">${active}</div></div>
    </div>
    <div class="grid g2" id="sumgrid">
      <div class="card"><h2>Pedidos por estado</h2>
        <div class="chips">${meta.statuses.map((st) => `<a class="chip" href="#/pedidos" data-s="${st}">${badge(st)} ${s.ordersByStatus[st]}</a>`).join("")}</div></div>
      <div class="card"><h2>Reponer stock</h2>${s.lowStock.length ? `<table><tbody>${s.lowStock.map((l) =>
        `<tr><td>${esc(l.product)} ${esc(l.flavor)}</td><td class="num low">${l.stock}</td><td class="num muted">mín. ${l.reorderLevel}</td></tr>`).join("")}</tbody></table>`
        : `<p class="muted">Todo el stock está sobre el mínimo.</p>`}</div>
      <div class="card"><h2>Unidades vendidas</h2>${s.unitsBySku.length ? s.unitsBySku.map((u) => `
        <div class="row"><span>${esc(u.product)} ${esc(u.flavor)}</span><span class="spacer"></span><strong>${u.units}</strong><span class="muted">${money(u.revenueCents)}</span></div>
        <div class="bar"><i data-w="${Math.round((u.units / maxUnits) * 100)}"></i></div>`).join("") : `<p class="muted">Sin ventas aún.</p>`}</div>
      <div class="card"><h2>Pedidos por distrito</h2>${s.byDistrict.length ? `<table><tbody>${s.byDistrict.map((d) =>
        `<tr><td>${esc(d.district)}</td><td class="num">${d.orders}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Sin datos.</p>`}</div>
    </div>`;
  $("#sumgrid").style.marginTop = "14px";
  paintBars(view);
  view.querySelectorAll("a.chip[data-s]").forEach((a) => a.addEventListener("click", () => (orderFilter.status = a.dataset.s)));
}

route();
