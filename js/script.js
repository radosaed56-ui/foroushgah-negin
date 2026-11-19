console.log('ایجنت حرفه‌ای سایت‌ساز آماده است.');
var SHOP_CART_KEY = 'shop_cart_v1';
function shopEscapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function formatToman(n) {
  try { return Number(n).toLocaleString('en-US') + ' تومان'; } catch (e) { return n + ' تومان'; }
}
function loadCart() {
  try { var c = JSON.parse(localStorage.getItem(SHOP_CART_KEY)); return c ? c : []; } catch (e) { return []; }
}
function saveCart(c) {
  try { localStorage.setItem(SHOP_CART_KEY, JSON.stringify(c)); } catch (e) {}
}
function cartTotalCount() {
  var c = loadCart(); var n = 0;
  for (var i = 0; i < c.length; i++) { n += c[i].qty; }
  return n;
}
function updateCartBadge() {
  var els = document.querySelectorAll('#cartCount');
  for (var i = 0; i < els.length; i++) { els[i].textContent = cartTotalCount(); }
}
function showToast(msg) {
  var t = document.getElementById('shopToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'shopToast';
    t.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-xl';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(function () { t.style.display = 'none'; }, 2500);
}
function addToCart(name, price) {
  var cart = loadCart(); var found = null;
  for (var i = 0; i < cart.length; i++) { if (cart[i].name === name) { found = cart[i]; } }
  if (found) { found.qty += 1; } else { cart.push({ name: name, price: price || 0, qty: 1 }); }
  saveCart(cart); updateCartBadge(); renderCart();
  showToast('«' + name + '» به سبد خرید اضافه شد');
}
function removeFromCart(idx) {
  var cart = loadCart(); cart.splice(idx, 1);
  saveCart(cart); updateCartBadge(); renderCart();
}
function changeQty(idx, d) {
  var cart = loadCart(); if (!cart[idx]) { return; }
  cart[idx].qty += d;
  if (cart[idx].qty <= 0) { cart.splice(idx, 1); }
  saveCart(cart); updateCartBadge(); renderCart();
}
function renderCart() {
  var drawer = document.getElementById('cartDrawer');
  if (!drawer) { return; }
  var list = document.getElementById('cartItems');
  var totalEl = document.getElementById('cartTotal');
  var checkout = document.getElementById('cartCheckout');
  var empty = document.getElementById('cartEmpty');
  var cart = loadCart(); var total = 0; var html = '';
  for (var i = 0; i < cart.length; i++) {
    var it = cart[i]; var line = (it.price || 0) * it.qty; total += line;
    html += '<div class="flex items-center justify-between gap-2 py-2 border-b border-slate-700/20">'
      + '<span class="flex-1 text-sm font-bold">' + shopEscapeHtml(it.name) + '</span>'
      + '<span class="flex items-center gap-1"><button type="button" onclick="changeQty(' + i + ',-1)" class="border px-2 py-1 rounded">-</button>'
      + '<span class="text-sm font-bold">' + it.qty + '</span>'
      + '<button type="button" onclick="changeQty(' + i + ',1)" class="border px-2 py-1 rounded">+</button></span>'
      + '<span class="text-sm font-black">' + formatToman(line) + '</span>'
      + '<button type="button" onclick="removeFromCart(' + i + ')" class="text-red-500 font-bold">X</button></div>';
  }
  list.innerHTML = html;
  if (totalEl) { totalEl.textContent = formatToman(total); }
  if (empty) { empty.style.display = cart.length ? 'none' : 'block'; }
  if (checkout) {
    var wa = drawer.getAttribute('data-wa') || '';
    if (!wa) {
      checkout.style.opacity = '0.5';
      checkout.removeAttribute('href');
      checkout.textContent = 'شماره واتساپ وارد نشده — سفارش غیرفعال است';
    } else if (!cart.length) {
      checkout.style.opacity = '0.5';
      checkout.removeAttribute('href');
    } else {
      checkout.style.opacity = '1';
      var lines = ['سلام، می‌خواهم این کالاها را سفارش بدهم:'];
      for (var j = 0; j < cart.length; j++) {
        lines.push('• ' + cart[j].name + ' × ' + cart[j].qty + ' — ' + formatToman((cart[j].price || 0) * cart[j].qty));
      }
      lines.push('جمع کل: ' + formatToman(total));
      checkout.href = '' + wa + '?text=' + encodeURIComponent(lines.join('\n'));
    }
  }
}
function toggleCart() {
  var d = document.getElementById('cartDrawer');
  if (!d) { return; }
  if (d.classList.contains('hidden')) { renderCart(); d.classList.remove('hidden'); }
  else { d.classList.add('hidden'); }
}
function closeCart() {
  var d = document.getElementById('cartDrawer');
  if (d) { d.classList.add('hidden'); }
}
function filterProducts() {
  var grid = document.getElementById('productGrid');
  var input = document.getElementById('shopSearch');
  if (!grid || !input) { return; }
  var q = input.value.trim();
  var shown = 0;
  for (var i = 0; i < grid.children.length; i++) {
    var card = grid.children[i];
    var text = (card.getAttribute('data-name') || '') + ' ' + card.textContent;
    var ok = (q === '') || (text.indexOf(q) !== -1);
    card.style.display = ok ? '' : 'none';
    if (ok) { shown += 1; }
  }
  var rc = document.getElementById('resultCount');
  if (rc) { rc.textContent = shown + ' کالا پیدا شد'; }
}
function sortProducts(mode) {
  var grid = document.getElementById('productGrid');
  if (!grid) { return; }
  var cards = [];
  for (var i = 0; i < grid.children.length; i++) { cards.push(grid.children[i]); }
  cards.sort(function (a, b) {
    var pa = parseFloat(a.getAttribute('data-price')) || 0;
    var pb = parseFloat(b.getAttribute('data-price')) || 0;
    var ra = parseFloat(a.getAttribute('data-rating')) || 0;
    var rb = parseFloat(b.getAttribute('data-rating')) || 0;
    if (mode === 'cheap') { return pa - pb; }
    if (mode === 'expensive') { return pb - pa; }
    return rb - ra;
  });
  for (var j = 0; j < cards.length; j++) { grid.appendChild(cards[j]); }
  filterProducts();
}
document.addEventListener('DOMContentLoaded', function () {
  updateCartBadge(); renderCart();
  var s = document.getElementById('shopSearch');
  if (s) { s.addEventListener('input', filterProducts); filterProducts(); }
});

function toggleMenu() {
  var m = document.getElementById('sideMenu');
  var o = document.getElementById('menuOverlay');
  if (!m) { return; }
  var closed = m.classList.contains('translate-x-full');
  if (closed) { m.classList.remove('translate-x-full'); if (o) { o.classList.remove('hidden'); } }
  else { m.classList.add('translate-x-full'); if (o) { o.classList.add('hidden'); } }
}
