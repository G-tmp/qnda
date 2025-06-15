// main.js
import { loadBook, renderBook } from './epub-loader.js';
import { setupUI , applyTheme} from './ui.js';

const elements = {
  sidebar: document.getElementById("side-bar"),
  toolbar: document.getElementById("toolbar"),
  dropTarget: document.getElementById("drop-target"),
  next: document.getElementById("next"),
  prev: document.getElementById("prev"),
  sidebarTitle: document.getElementById("side-bar-title"),
  sidebarAuthor: document.getElementById("side-bar-author"),
  sidebarCover: document.getElementById("side-bar-cover"),
  menuButton: document.getElementById("menu-button"),
  menu: document.getElementById("menu"),
  sidebarButton: document.getElementById("side-bar-button"),
  dimmingOverlay: document.getElementById("dimming-overlay"),
  fontSizeSub: document.getElementById("fontsize-sub"),
  fontSizeAdd: document.getElementById("fontsize-add"),
  lineHeightSub: document.getElementById("line-height-sub"),
  lineHeightAdd: document.getElementById("line-height-add"),
  tocView: document.getElementById("toc-view")
};

const fileInput = document.getElementById("file-input");
const fileButton = document.getElementById("file-button");
const dropTarget = document.getElementById("drop-target");

fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (file) await openBook(file);
};

fileButton.onclick = () => fileInput.click();

elements.dropTarget.addEventListener("dragover", e => e.preventDefault());
elements.dropTarget.addEventListener("drop", async e => {
  e.preventDefault();
  const item = Array.from(e.dataTransfer.items).find(i => i.kind === "file");
  if (item) {
    const entry = item.webkitGetAsEntry();
    const file = entry.isFile ? item.getAsFile() : null;
    if (file) 
      await openBook(file);
  }
});


async function openBook(file) {
  const { book, rendition } = await loadBook(file, "viewer");
  console.log(book);
  document.body.removeChild(dropTarget);
  setupUI({ ...elements, book, rendition, applyTheme });
  renderBook(rendition);
  document.title = book.package.metadata.title;
}
