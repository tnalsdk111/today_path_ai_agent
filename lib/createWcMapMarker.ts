/** 지도용 화장실 마커 — primary-container 원 + 흰색 wc 아이콘 */
export function createWcMapMarkerContent(title: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.title = title;

  const icon = document.createElement("span");
  icon.className = "material-symbols-outlined";
  icon.textContent = "wc";
  icon.setAttribute("aria-hidden", "true");

  wrap.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "width:32px",
    "height:32px",
    "background:#2A6B35",
    "border:2px solid #fff",
    "border-radius:50%",
    "box-shadow:0 2px 6px rgba(0,0,0,0.2)",
  ].join(";");
  icon.style.cssText = [
    "font-size:18px",
    "line-height:1",
    "color:#fff",
    "font-variation-settings:'FILL' 1",
  ].join(";");

  wrap.appendChild(icon);
  return wrap;
}
