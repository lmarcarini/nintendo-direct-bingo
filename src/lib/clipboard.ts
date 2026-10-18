// Takes a promise so the clipboard write starts during the click: Safari
// refuses it if it only begins once the screenshot is done
export const copyImage = (image: Promise<Blob>) =>
  navigator.clipboard.write([new ClipboardItem({ "image/png": image })]);

export const copyLink = () =>
  navigator.clipboard.writeText(window.location.href);
