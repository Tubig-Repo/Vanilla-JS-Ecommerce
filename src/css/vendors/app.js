var productData = (function () {
  const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "n5ikxx5xrew0",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "YN0YYZ9VcuYW_bpJRFEsLyz8imT3nWn3ZxCpi3ihGrY",
  });

  let fetchProducts = async function () {
    try {
      let result = await fetch("products.json");
      let data = await result.json();
      return data.items;
    } catch (error) {
      return error;
    }
  };
  let fetchContentful = async function () {
    let contentful = await client.getEntries({
      content_type: "saikoProducts",
    });
    try {
      return contentful;
    } catch (error) {
      console.log(error);
    }
  };
  return {
    getProducts: function () {
      return fetchProducts();
    },

    getContentfulData: function () {
      return fetchContentful();
    },
  };
})();
// where the user's cart items are stored which is in the local database
let localStorage = (function () {
  let generateNewData = function (data, id) {
    return {
      title: data.fields.title,
      price: data.fields.price,
      image: data.fields.image.fields.file.url,
      id: id,
      quantity: 1,
    };
  };
  return {
    saveToLocal: function (item) {
      let itemArray, ID;

      if (window.localStorage.getItem("items")) {
        itemArray = JSON.parse(window.localStorage.getItem("items"));
        ID = itemArray[itemArray.length - 1].id + 1;
        itemArray.push(generateNewData(item, item.fields.id));
      } else {
        ID = 0;
        itemArray = [generateNewData(item, item.fields.id)];
      }
      window.localStorage.setItem("items", JSON.stringify(itemArray));
      return itemArray[itemArray.length - 1];
    },

    getLocalStorageData: function () {
      return JSON.parse(window.localStorage.getItem("items"));
    },

    calculateTotal: function () {
      let itemArray = JSON.parse(window.localStorage.getItem("items"));
      let priceTotal = 0;
      itemArray.forEach((data) => {
        priceTotal += data.price * data.quantity;
      });

      return priceTotal;
    },
  };
})();

//where we display the items on the UI
let displayProducts = (function () {
  let DOMStrings = {
    productContainer: ".product-container",
    cartContainer: ".cart-items-container",
    quantityContainer: ".inner-quantity-container",
    cartButton: ".cart-navigation",
    hideCartBtn: ".hideCart",
    totalAmount: ".total-amount",
  };

  return {
    getDOMStrings: function () {
      return DOMStrings;
    },
    displayItem: function (newItem) {
      document.querySelector(
        DOMStrings.cartContainer
      ).innerHTML += `<div class="cart-items" id="${newItem.id}">
          <img
            class="cart-addedImg"
            src="${newItem.image}"
            alt="${newItem.title}"
          />
          <div class="product-details">
              <h4>${newItem.title}</h4>
              <h4 class="price">${newItem.price}¥</h4>
              <span class="remove-current-item">remove</span>  
          </div>
          <div class="quantity-container">
            <div class="inner-quantity-container">
              <button class="minus">-</button>
              <input
                type="text"
                value="${newItem.quantity}"
                min="1"
                class="quantity"
                readonly
                id="quantity-${newItem.id}"
              />
              <button class="plus">+</button>
            </div>
          </div>
        </div>`;
    },
    displayTotal: function (total) {
      document.querySelector(".total-amount").innerHTML = total + "¥";
    },

    clearCart: function () {
      document.querySelector(DOMStrings.cartContainer).innerHTML = "";
      document.querySelector(DOMStrings.totalAmount).innerHTML = "0.00";
    },
  };
})();

// universal controller
var universalController = (function (productJSON, local, display) {
  let DOM = display.getDOMStrings();
  let setUpEventListeners = function () {
    document
      .querySelector(DOM.productContainer)
      .addEventListener("click", addItemCart);

    document
      .querySelector(DOM.cartContainer)
      .addEventListener("click", addQuantity);
    document
       .querySelector(DOM.cartButton)
      .addEventListener("click", updateCartProducts);
    
    document
      .querySelector(DOM.hideCartBtn)
      .addEventListener("click", display.clearCart);

    document
      .querySelector(DOM.cartContainer)
      .addEventListener("click", removeItem);
  };

  let updateTotal = function () {
    if (local.getLocalStorageData() !== null) {
      let totalAmount;
      totalAmount = local.calculateTotal();
      display.displayTotal(totalAmount);
    }
  };

  let updateCartProducts = function () {
    if (local.getLocalStorageData().length > 0) {
      //1.Get data from the localstorage
      let dataLocal = local.getLocalStorageData();
      //2.Update the products on the sliding menu
      dataLocal.forEach((current) => display.displayItem(current));
      //3. Update the total price
      updateTotal();
    } else if (local.getLocalStorageData() == 0) {
      //removes the key in
      window.localStorage.removeItem("items");
    }
  };

  let addItemCart = function (event) {
    let itemID, newItem;
    itemID = event.target.id;
    if (itemID) {
      //1.Get the chosen product Item from the database
      productJSON.getProducts().then((data) => {
        //2.Save the item to our local storage
        newItem = local.saveToLocal(data[parseInt(itemID) - 1]);
        //3.Display the item in the item in the cart
        updateCartProducts();
        //4.Update the total price
        updateTotal();
      });

      productJSON.getContentfulData().then((data) => {
        console.log(data);
      });
    }
  };
  let getIndexOfItem = function (itemID) {
    let localData, ids, index;
    localData = local.getLocalStorageData();
    ids = localData.map((current) => current.id);
    return (index = ids.indexOf(parseInt(itemID)));
  };
  let addQuantity = function (event) {
    let buttonItem, parentID, item, index, localData;
    buttonItem = event.target.className;
    if (buttonItem == "minus" || buttonItem == "plus") {
      //1. increment or decrement the current value of the quantity
      if (buttonItem == "minus" && event.target.nextElementSibling.value > 1) {
        event.target.nextElementSibling.value--;
      } else if (buttonItem == "plus") {
        event.target.previousElementSibling.value++;
      }
      parentID = event.target.parentNode.parentNode.parentNode.id;
      //2.store the updated quantity to the localstorage
      item = JSON.parse(window.localStorage.getItem("items"));
      localData = local.getLocalStorageData();
      index = getIndexOfItem(parentID);
      localData[index]["quantity"] = document.getElementById(
        "quantity-" + parentID
      ).value;
      window.localStorage.setItem("items", JSON.stringify(localData));
      //3. Update totals
      updateTotal();
    }
  };

  let removeItem = function (event) {
    let buttonItem, parentID, localData, ids, index;
    buttonItem = event.target.className;
    if (buttonItem == "remove-current-item") {
      //1.get chosen item
      parentID = event.target.parentNode.parentNode.id;
      localData = local.getLocalStorageData();
      ids = localData.map((current) => current.id);
      //2.locate the id in from the array
      index = getIndexOfItem(parentID);
      //3.delete the item
      localData.splice(index, 1);
      //3.update the storage
      window.localStorage.setItem("items", JSON.stringify(localData));
      //4.update the UI
      display.clearCart();
      updateCartProducts();
      updateTotal();
    }
  };

  return {
    init: function () {
      setUpEventListeners();
    },
  };
})(productData, localStorage, displayProducts);

universalController.init();
