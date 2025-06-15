// ui.js
export function setupUI({
  sidebar, toolbar, next, prev, sidebarTitle,
  sidebarAuthor, sidebarCover, menuButton, menu, sidebarButton,
  dimmingOverlay, fontSizeSub, fontSizeAdd, lineHeightSub, lineHeightAdd,
  tocView, rendition, book, applyTheme
}) {
  let fontSize = 17;
  let lineHeight = 16;

  next.innerText = "›";
  prev.innerText = "‹";
  sidebar.style.visibility = "visible";
  toolbar.style.visibility = "visible";

  next.addEventListener("click", (e) => {
    rendition.next();
    e.preventDefault();
  });

  prev.addEventListener("click", (e) => {
    rendition.prev();
    e.preventDefault();
  });

  const keyListener = (e) => {
    if ((e.keyCode || e.which) == 37) rendition.prev();
    if ((e.keyCode || e.which) == 39) rendition.next();
  };

  document.addEventListener("keyup", keyListener);

  menuButton.onclick = () => menu.classList.toggle("show");
  sidebarButton.onclick = () => {
    dimmingOverlay.classList.add("show");
    sidebar.classList.add("show");
  };
  dimmingOverlay.onclick = () => {
    dimmingOverlay.classList.remove("show");
    sidebar.classList.remove("show");
  };

  window.onblur = () => menu.classList.remove("show");
  window.onclick = (e) => {
    if (!menu.parentNode.contains(e.target)) {
      menu.classList.remove("show");
    }
  };

  rendition.hooks.content.register(()=>{applyTheme(rendition, fontSize, lineHeight)});
  fontSizeSub.onclick = () => {
    fontSize--;
    applyTheme(rendition, fontSize, lineHeight);
  };
  fontSizeAdd.onclick = () => {
    fontSize++;
    applyTheme(rendition, fontSize, lineHeight);
  };
  lineHeightSub.onclick = () => {
    lineHeight--;
    applyTheme(rendition, fontSize, lineHeight);
  };
  lineHeightAdd.onclick = () => {
    lineHeight++;
    applyTheme(rendition, fontSize, lineHeight);
  };
  menu.onclick = () => {
    menu.classList.toggle("show");
  }

  book.ready.then(() => {
    rendition.display();
    sidebarTitle.innerText = book.package.metadata.title;
    sidebarAuthor.innerText = book.package.metadata.creator;

    if (book.cover) {
      book.archive.createUrl(book.cover)
        .then(url => sidebarCover.src = url);
    } else {
      sidebarCover.src = "";
    }

    renderTocTree(book.navigation.toc, tocView, rendition);
  });
}


function renderTocTree(toc, tocView, rendition) {
  let id = 0;

  const createExpanderIcon = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 13 10");
    svg.setAttribute("width", "13");
    svg.setAttribute("height", "13");
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", "2 1, 12 1, 7 9");
    svg.appendChild(polygon);
    return svg;
  };

  const recurseAppend = (list, parent, depth) => {
    id++;
    const ol = document.createElement("ol");
    parent.appendChild(ol);
    if (depth === 0) {
      ol.setAttribute("role", "tree");
    } else {
      ol.setAttribute("role", "group");
      ol.id = "toc-element-" + (id - 1);
    }

    list.forEach(chapter => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.textContent = chapter.label;
      a.setAttribute("role", "treeitem");
      a.style.paddingInlineStart = `${(depth + 1) * 24}px`;
      a.setAttribute("href", chapter.href);
      li.appendChild(a);
      li.setAttribute("role", "none");
      ol.appendChild(li);

      a.onclick = e => {
        e.preventDefault();
        rendition.display(chapter.href);
      };

      if (chapter.subitems.length) {
        a.setAttribute("aria-owns", "toc-element-" + id);
        a.setAttribute("aria-expanded", "false");
        recurseAppend(chapter.subitems, li, depth + 1);
        const icon = createExpanderIcon();
        icon.onclick = e => {
          e.preventDefault();
          e.stopPropagation();
          const expanded = a.getAttribute("aria-expanded") === "true";
          a.setAttribute("aria-expanded", expanded ? "false" : "true");
        };
        a.prepend(icon);
      }
    });
  };

  // tocView.innerHTML = "";
  recurseAppend(toc, tocView, 0);
}


export function applyTheme(rendition, fontSize, lineHeight) {
  let rules = {
    "body, p, a, span, div ": {
      "font-size": `${fontSize}px !important`,
      "line-height": `${lineHeight / 10} !important`,
      "margin": "15px 0 !important",
    },
  }

  if(rendition)
    rendition.getContents().forEach(c => c.addStylesheetRules(rules));
} 