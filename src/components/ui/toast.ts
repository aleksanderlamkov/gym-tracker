export function showToast(text: string) {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: text }));
}
