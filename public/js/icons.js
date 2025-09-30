// public/js/icons.js
// Catálogo de iconos simples (Heroicons outline simplificados / emojis) para selector reutilizable
// Cada icono: key único (guardar en DB), label visible y svg (o emoji) para previsualizar

window.CATALOG_ICONS = [
  { key:'leaf', label:'Hoja', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M3 21s0-6 4-10S17 3 21 3c0 4-3 10-8 14s-10 4-10 4Z"/></svg>' },
  { key:'seed', label:'Semilla', svg:'🌱' },
  { key:'water', label:'Agua', svg:'💧' },
  { key:'sun', label:'Sol', svg:'☀️' },
  { key:'fert', label:'Fertilizante', svg:'🧪' },
  { key:'tool', label:'Herramienta', svg:'🛠️' },
  { key:'tractor', label:'Tractor', svg:'🚜' },
  { key:'shield', label:'Protección', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 3 4.5 6v6c0 5.25 3.75 10.5 7.5 12 3.75-1.5 7.5-6.75 7.5-12V6L12 3Z"/></svg>' },
  { key:'ph', label:'pH', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M12 4v16"/></svg>' },
  { key:'dna', label:'Genética', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 4c6 0 6 8 12 8-6 0-6 8-12 8m0-16c0 2 2 4 5 4s5 2 5 4m-10 4c0-2 2-4 5-4s5-2 5-4"/></svg>' },
  { key:'bug', label:'Plaga', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3h6m-3 4v4m-4-4H5l2 3H5l2 3H5l2 3H5c0 3 2 5 7 5s7-2 7-5h-2l2-3h-2l2-3h-2l2-3h-4M7 7a5 5 0 0 1 10 0"/></svg>' },
  { key:'spray', label:'Pulverizador', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 2h4v4h-4zM8 6h8v6H8zM6 12h12v10H6z"/></svg>' },
  { key:'warehouse', label:'Almacén', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 20V9l9-6 9 6v11M5 20h14M7 20v-6h10v6"/></svg>' },
  { key:'temp', label:'Temperatura', svg:'🌡️' },
  { key:'rain', label:'Lluvia', svg:'☔' },
  { key:'wind', label:'Viento', svg:'🌬️' },
  { key:'calendar', label:'Ciclo', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 3v4m10-4v4M5 8h14M5 21h14V8H5v13Z"/></svg>' },
  { key:'soil', label:'Suelo', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17h18M3 12h18M3 7h18"/></svg>' },
  { key:'analysis', label:'Análisis', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20h4V10H4v10Zm6 0h4V4h-4v16Zm6 0h4v-7h-4v7Z"/></svg>' },
  { key:'growth', label:'Crecimiento', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 20c4-9 10-9 14 0M5 20v-6m14 6v-6M12 4v6m0 0 3-3m-3 3-3-3"/></svg>' },
  { key:'package', label:'Empaque', svg:'📦' },
  { key:'quality', label:'Calidad', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 17.5 6.5 21l1-6L3 10l6-.9L12 3l3 6.1 6 .9-4.5 5 1 6z"/></svg>' },
  { key:'balance', label:'Balance', svg:'⚖️' },
  { key:'warning', label:'Advertencia', svg:'⚠️' },
  { key:'doc', label:'Documento', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M13 2v6h5"/></svg>' },
  { key:'lab', label:'Laboratorio', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h4v6l-3 7c0 3 2 5 5 5s5-2 5-5l-3-7V3h4"/></svg>' },
  { key:'harvest', label:'Cosecha', svg:'🌾' },
  { key:'distribution', label:'Distribución', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z"/></svg>' },
  { key:'eco', label:'Eco', svg:'♻️' }
  
  // --- Frutas ---
  ,{ key:'apple', label:'Manzana', svg:'🍎' }
  ,{ key:'pear', label:'Pera', svg:'🍐' }
  ,{ key:'grape', label:'Uva', svg:'🍇' }
  ,{ key:'banana', label:'Banana', svg:'🍌' }
  ,{ key:'orange', label:'Naranja', svg:'🍊' }
  ,{ key:'lemon', label:'Limón', svg:'🍋' }
  ,{ key:'lime', label:'Lima', svg:'<span class="text-sm">🟢</span>' }
  ,{ key:'strawberry', label:'Fresa', svg:'🍓' }
  ,{ key:'blueberry', label:'Arándano', svg:'🫐' }
  ,{ key:'cherry', label:'Cereza', svg:'🍒' }
  ,{ key:'peach', label:'Durazno', svg:'🍑' }
  ,{ key:'watermelon', label:'Sandía', svg:'🍉' }
  ,{ key:'melon', label:'Melón', svg:'🍈' }
  ,{ key:'pineapple', label:'Piña', svg:'🍍' }
  ,{ key:'mango', label:'Mango', svg:'🥭' }
  ,{ key:'kiwi', label:'Kiwi', svg:'🥝' }
  ,{ key:'coconut', label:'Coco', svg:'🥥' }
  ,{ key:'papaya', label:'Papaya', svg:'<span class="text-xs">🥭*</span>' } // * reutiliza mango como aproximación
  ,{ key:'avocado', label:'Aguacate', svg:'🥑' }
  ,{ key:'plum', label:'Ciruela', svg:'<span class="text-sm">🟣</span>' }
  
  // --- Hortalizas y vegetales ---
  ,{ key:'tomato', label:'Tomate', svg:'🍅' }
  ,{ key:'potato', label:'Papa', svg:'🥔' }
  ,{ key:'carrot', label:'Zanahoria', svg:'🥕' }
  ,{ key:'onion', label:'Cebolla', svg:'🧅' }
  ,{ key:'garlic', label:'Ajo', svg:'🧄' }
  ,{ key:'pepper', label:'Pimiento/Chile', svg:'🌶️' }
  ,{ key:'cucumber', label:'Pepino', svg:'🥒' }
  ,{ key:'lettuce', label:'Lechuga', svg:'🥬' }
  ,{ key:'corn', label:'Maíz', svg:'🌽' }
  ,{ key:'pumpkin', label:'Calabaza', svg:'🎃' }
  ,{ key:'broccoli', label:'Brócoli', svg:'🥦' }
  ,{ key:'mushroom', label:'Hongo', svg:'🍄' }
  
  // --- Granos y semillas ---
  ,{ key:'wheat', label:'Trigo', svg:'🌾' }
  ,{ key:'rice', label:'Arroz', svg:'🍚' }
  ,{ key:'bean', label:'Frijol', svg:'🫘' }
  ,{ key:'soy', label:'Soya', svg:'<span class="text-sm">🟤</span>' }
  ,{ key:'coffee', label:'Café', svg:'☕' }
  ,{ key:'cacao', label:'Cacao', svg:'🍫' }
  ,{ key:'sugarcane', label:'Caña Azúcar', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3v18M16 3v18M8 8h8M8 14h8"/></svg>' }
  ,{ key:'barley', label:'Cebada', svg:'<span class="text-sm">🌿</span>' }
  ,{ key:'cotton', label:'Algodón', svg:'<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3a5 5 0 0 0-5 5 5 5 0 0 0-2 9h14a5 5 0 0 0-2-9 5 5 0 0 0-5-5Z"/><path d="M12 12v9"/></svg>' }
  
  // --- Frutos secos y especias ---
  ,{ key:'almond', label:'Almendra', svg:'<span class="text-sm">🟫</span>' }
  ,{ key:'peanut', label:'Maní', svg:'🥜' }
  ,{ key:'cashew', label:'Anacardo', svg:'<span class="text-sm">⚪</span>' }
  ,{ key:'walnut', label:'Nuez', svg:'<span class="text-sm">🤎</span>' }
  ,{ key:'cinnamon', label:'Canela', svg:'<span class="text-sm">🟤</span>' }
  ,{ key:'herb', label:'Hierba/Aromática', svg:'🌿' }
  
  // --- Oleaginosas / Especiales ---
  ,{ key:'olive', label:'Olivo', svg:'🫒' }
  ,{ key:'oliveoil', label:'Aceite Oliva', svg:'<span class="text-sm">🫒🛢️</span>' }
  ,{ key:'sunflower', label:'Girasol', svg:'🌻' }
  ,{ key:'agave', label:'Agave', svg:'<span class="text-sm">🟢</span>' }
  ,{ key:'aloe', label:'Aloe', svg:'<span class="text-sm">💚</span>' }
  ,{ key:'tobacco', label:'Tabaco', svg:'<span class="text-sm">🚬</span>' }
  ,{ key:'hemp', label:'Cáñamo', svg:'<span class="text-sm">🌿*</span>' }
];

// Utilidad para obtener SVG/emoji por key
window.getIconSvg = function(key){ const f=window.CATALOG_ICONS.find(i=>i.key===key); return f? f.svg: ''; };