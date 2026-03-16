/**
 * Opens the FEVO checkout in a popup window sized like a right-side panel.
 * FEVO blocks iframe embedding, so a popup is the best embedded-feeling option.
 */
export function openCheckoutPopup(url: string): void {
  const width = 480;
  const height = window.innerHeight;
  const left = window.screenX + window.innerWidth - width;
  const top = window.screenY;

  window.open(
    url,
    'fevo-checkout',
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`,
  );
}
