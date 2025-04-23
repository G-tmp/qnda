'use strict';

const sidebar = document.getElementById("side-bar");
const toolbar = document.getElementById("toolbar");
const sidebar_button = document.getElementById("side-bar-button");
const dimming_overlay = document.getElementById("dimming-overlay");
const sidebar_title = document.getElementById("side-bar-title"); 
const sidebar_cover = document.getElementById("side-bar-cover"); 
const sidebar_author = document.getElementById("side-bar-author");
const menu_button = document.getElementById("menu-button");
const menu = document.getElementById("menu");
const fontsize_add = document.getElementById("fontsize-add");
const fontsize_sub = document.getElementById("fontsize-sub");
const lineheight_sub = document.getElementById("line-height-sub");
const lineheight_add = document.getElementById("line-height-add");
const themes = document.getElementById("themes");
const toc_view = document.getElementById("toc-view");
const next = document.getElementById("next");
const prev = document.getElementById("prev");
const select = document.getElementById("toc");
const file_input = document.getElementById("file-input");
const file_button = document.getElementById("file-button");
const drop_target = document.getElementById("drop-target");


drop_target.addEventListener("dragover", (e) => {
   e.preventDefault();
});
drop_target.addEventListener("drop", (e) => {
   e.preventDefault();
   const item = Array.from(e.dataTransfer.items).find(item => item.kind === "file");
   if (item) {
      const entry = item.webkitGetAsEntry();
      open(entry.isFile ? item.getAsFile() : entry);
   }
});

file_input.onchange = e => {
   // open(e.target.files[0]).catch(e => console.error(e))
   open(e.target.files[0]);
}
file_button.onclick = () => {
   file_input.click();
}

async function open(file){
   next.innerText = "›";
   prev.innerText = "‹";
   document.body.removeChild(drop_target);
   sidebar.style.visibility = "visible";
   toolbar.style.visibility = "visible";

   const book = await ePub(file);
   const rendition = await book.renderTo("viewer", { flow: "scrolled-doc", width: "100%", fullsize: true });
   await rendition.display();

   let fontSize = 17;
   let lineheight = 16;

   console.log(book)
   document.title = book.package.metadata.title;

   next.addEventListener("click", (e) => {
      rendition.next();
      e.preventDefault();
   });

   prev.addEventListener("click", (e) => {
      // window.scrollTo(0,0);
      rendition.prev();
      e.preventDefault();
   });

   const keyListener = (e) => {
      // Left arrow Key
      if ((e.keyCode || e.which) == 37) {
         rendition.prev();
      }

      // Right arrow Key
      if ((e.keyCode || e.which) == 39) {
         rendition.next();
      }
   }

   document.addEventListener("keyup", keyListener);

   rendition.on("rendered", (section) => {
      // keybroad lose focus after clicking iframe
      const iframe = rendition.getContents()[0].document;
      iframe.addEventListener("keyup", keyListener);

      // find and high light current item in toc
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

   menu_button.onclick = () => {
      menu.classList.toggle("show");
   }

   sidebar_button.onclick = () => {
      dimming_overlay.classList.add("show");
      sidebar.classList.add("show");
   };

   dimming_overlay.onclick =  () => {
      dimming_overlay.classList.remove("show");
      sidebar.classList.remove("show");
   };

   window.onblur = () => menu.classList.remove("show");
   window.onclick = (e) => {
      if (!menu.parentNode.contains(e.target)){
         menu.classList.remove("show");
      }
   }

   const applyTheme = () => {
      let rules = {
         "body, p, a, span, div ": {
            "font-size": `${fontSize}px !important`,
            "line-height": `${lineheight / 10} !important`,
            "margin": "15px 0 0 !important",
        },
      }

      try{
         if(rendition)
            rendition.getContents().forEach(c => c.addStylesheetRules(rules));
      }catch (err){
         console.err(err);
      }
   }

   rendition.hooks.content.register(applyTheme.bind());

   fontsize_sub.onclick = () => {
      fontSize--
      applyTheme();
   }
   fontsize_add.onclick = () => {
      fontSize++
      applyTheme();
   }
   lineheight_sub.onclick = () => {
      lineheight--
      applyTheme();
   }
   lineheight_add.onclick = () => {
      lineheight++
      applyTheme();
   }
   menu.onclick = () => {
      menu.classList.toggle("show");
   }

   book.ready.then(() => {
      sidebar_title.innerText = book.package.metadata.title;
      sidebar_author.innerText = book.package.metadata.creator;
      if (book.cover) {
         book.archive.createUrl(book.cover)
            .then((url) => sidebar_cover.src = url);
      } else {
         sidebar_cover.src = "";
      }

      const createExpanderIcon = () => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          svg.setAttribute('viewBox', '0 0 13 10')
          svg.setAttribute('width', '13')
          svg.setAttribute('height', '13')
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
          polygon.setAttribute('points', '2 1, 12 1, 7 9')
          svg.append(polygon)
          return svg
      }

      let id = 0;
      const recurseAppend = (list, parent, depth) => {
         id++;
         const ol = document.createElement("ol");
         parent.appendChild(ol);
         if (depth == 0) {
            ol.setAttribute("role", "tree");
         } else {
            ol.setAttribute("role", "group");
            ol.id = "toc-element-" + (id-1);
         }

         list.forEach((chapter) => {
            const li = document.createElement("li");
            let a = document.createElement("a");
            a.textContent = chapter.label;
            a.setAttribute("role", "treeitem")
            a.style.paddingInlineStart = `${(depth + 1) * 24}px`
            a.setAttribute("href", chapter.href);
            li.appendChild(a);
            li.setAttribute('role', 'none');
            ol.appendChild(li);

            a.onclick = (e) => {
               let href = a.getAttribute("href");
               rendition.display(href);
               return false;
            };

            if (chapter.subitems.length != 0) {
               a.setAttribute('aria-owns', "toc-element-" + id);
               a.setAttribute("aria-expanded", "false");
               recurseAppend(chapter.subitems, li, depth + 1);
               const icon = createExpanderIcon();
               icon.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  a.setAttribute("aria-expanded", a.getAttribute("aria-expanded") == "true" ? "false" : "true");
               }
               a.prepend(icon);
            }
         });
      }

      recurseAppend(book.navigation.toc, toc_view, 0);

   });

}