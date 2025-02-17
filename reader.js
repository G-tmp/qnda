'use strict';

const sidebar = document.getElementById("side-bar");
const headerbar = document.getElementById("header-bar");
const sidebar_button = document.getElementById("side-bar-button");
const dimming_overlay = document.getElementById("dimming-overlay");
const sidebar_title = document.getElementById("side-bar-title"); 
const sidebar_cover = document.getElementById("side-bar-cover"); 
const sidebar_author = document.getElementById("side-bar-author"); 
const toc_view = document.getElementById("toc-view");
const next = document.getElementById("next");
const prev = document.getElementById("prev");
const select = document.getElementById("toc");
const file_input = document.getElementById("file-input");
const file_button = document.getElementById("file-button");
const drop_target = document.getElementById("drop-target");



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
   headerbar.style.visibility = "visible";

   var book = await ePub(file);
   var rendition = book.renderTo("viewer", { flow: "scrolled-doc", width: "100%", fullsize: true });
   await rendition.display();

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


   document.addEventListener("keyup", (e) => {
      // Left Key
      if ((e.keyCode || e.which) == 37) {
         rendition.prev();
      }

      // Right Key
      if ((e.keyCode || e.which) == 39) {
         rendition.next();
      }
   });


   rendition.on("relocated", (location) => {
      const listItems = document.querySelectorAll('#toc-view li');
      listItems.forEach((i) => {
         let a = i.childNodes[0];
         let href = a.getAttribute("href");
         if (location.start.href === href) {
            a.tabIndex = 0;
            a.setAttribute('aria-current', 'page');
            // a.scrollIntoView({ behavior: 'smooth', block: 'center' })
         } else {
            a.tabIndex = -1;
            a.removeAttribute('aria-current');
         }
      })

      if (location.atEnd) {
         next.style.visibility = "hidden";
      } else {
         next.style.visibility = "visible";
      }

      if (location.atStart) {
         prev.style.visibility = "hidden";
      } else {
         prev.style.visibility = "visible";
      }
   });


   sidebar_button.onclick = () => {
      dimming_overlay.classList.add("show");
      sidebar.classList.add("show");
   };

   dimming_overlay.onclick =  () => {
      dimming_overlay.classList.remove("show");
      sidebar.classList.remove("show");
   };


   book.ready.then(() => {
      sidebar_title.innerText = book.package.metadata.title;
      sidebar_author.innerText = book.package.metadata.creator;
      if (book.cover) {
         book.archive.createUrl(book.cover)
            .then((url) => sidebar_cover.src = url);
      } else {
         sidebar_cover.src = "";
      }

      const ol = document.createElement("ol")
      ol.setAttribute('role', 'tree')
      book.navigation.toc.forEach((chapter) => {
         let li = document.createElement("li");
         let a = document.createElement("a");
         a.textContent = chapter.label;
         a.setAttribute("role", "treeitem")
         a.style.paddingInlineStart = "24px"
         a.setAttribute("href", chapter.href);
         li.appendChild(a);
         li.setAttribute('role', 'none');
         ol.appendChild(li);

         let currentItem;

         a.onclick = () => {
            let url = a.getAttribute("href");
            rendition.display(url);
            return false;
         };
      });

      toc_view.append(ol);
   });

}

