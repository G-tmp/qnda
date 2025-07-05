// epub-loader.js
export async function loadBook(file, area) {
  const book = ePub(file);
  const rendition = book.renderTo(area, {
    flow: "scrolled",
    width: "100%",
    fullsize: true,
    spread: "always"
  });

  await rendition.display();

  return { book, rendition };
}


export function renderBook(rendition) {
  let location;
  let justResized = false;
  let correcting = false;

  rendition.on("relocated", () => {
    if (!justResized) {
      if (!correcting) {
        location = rendition.currentLocation().start.cfi;
      } else {
        correcting = false;
      }
    } else {
      justResized = false;
      correcting = true;
      rendition.display(location);
    }
  });

  rendition.on("resized", () => {
    justResized = true;
  });

  rendition.on("rendered", (section) => {
    const keyListener = (e) => {
      if ((e.keyCode || e.which) == 37) rendition.prev();
      if ((e.keyCode || e.which) == 39) rendition.next();
    };

    const iframe = rendition.getContents()[0]?.document;
    iframe?.addEventListener("keyup", keyListener);
    
    const listItems = document.querySelectorAll('#toc-view li');
    listItems.forEach((i) => {
      let a = i.childNodes[0];
      let href = a.getAttribute("href");
      if (section.href === href.split("#")[0]) {
        if (i.parentNode.previousElementSibling) {
            i.parentNode.previousElementSibling.setAttribute("aria-expanded", "true");
        }
        if (a.getAttribute("aria-expanded")) {
            a.setAttribute("aria-expanded", "true");
        }
        a.tabIndex = 0;
        a.setAttribute('aria-current', 'page');
        a.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        a.tabIndex = -1;
        a.removeAttribute('aria-current');
      }
    })

    if (section.next()) {
      next.style.visibility = "visible";
    } else {
      next.style.visibility = "hidden";
    }
    if (section.prev()) {
      prev.style.visibility = "visible";
    } else {
      prev.style.visibility = "hidden";
    }
  });
} 
