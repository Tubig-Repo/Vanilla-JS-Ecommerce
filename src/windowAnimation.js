let buttonClick = document.querySelector(".cart-navigation");
let hideButton = document.querySelector(".hideCart");
let overlay = document.querySelector(".no-overlay");
let itemsContainer = document.querySelector(".cart-items-container");
let productContainer = document.querySelector(".product-container");
let slidingMenu = document.querySelector(".sliding-menu-container");
hideButton.addEventListener("click", function () {
  slidingMenu.classList.remove("showCart");
  overlay.classList.remove("yes-overlay");
});
buttonClick.addEventListener("click", function () {
 
  overlay.classList.add("yes-overlay");
  slidingMenu.classList.add("showCart");
});

productContainer.addEventListener("click", function (event) {
  if (event.target.className == "addTo-cart") {
    overlay.classList.add("yes-overlay");
    slidingMenu.classList.add("showCart");
  }
});



