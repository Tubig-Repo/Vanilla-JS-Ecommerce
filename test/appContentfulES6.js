let productData = (function () {
  // fetching the contentful items 
  const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "n5ikxx5xrew0",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "YN0YYZ9VcuYW_bpJRFEsLyz8imT3nWn3ZxCpi3ihGrY",
  });

  // json products 
  let fetchProducts = async  ()=> {
    try {
      let result = await fetch("products.json");
      let data = await result.json();
      return data.items;
    } catch (error) {
      return error;
    }
  };
  // contentful products 
  let fetchContentful = async () => {
    let contentful = await client.getEntries({
      content_type: "saikoProducts",
      order : 'fields.id'
    });
    try {
      return contentful;
    } catch (error) {
      console.log(error);
    }
  };
  return {
    getProducts: () =>{
      return fetchProducts();
    },

    getContentfulData: ()  =>{
      return fetchContentful();
    },
  };
})();


// where the user's cart items are stored which is in the local database
let localStorage = (function () {  
  // generating contentful data
  let generateContentfulData =  function (title, price, imageURL, id){
    return {
      title : title , 
      price : price , 
      image : imageURL , 
      id : id , 
      quantity : 1 
    }
  }
  // get the localstorage data 
  let localStorageData = function () {
    return JSON.parse(window.localStorage.getItem("items"));
  };


  return {
    saveContentfulToLocal: function (title, price, imageURL , id ) {
      let itemArray, ID;
      if (localStorageData()) {
        itemArray = localStorageData();
        ID = itemArray[itemArray.length - 1].id + 1;
        itemArray.push(generateContentfulData(title, price, imageURL, ID));
      } else {
        ID = 0;
        itemArray = [];
        itemArray.push(generateContentfulData(title, price, imageURL, ID));
      }

      window.localStorage.setItem('items' , JSON.stringify(itemArray));

      return itemArray[itemArray.length  - 1 ];
    },
    getLocalStorageData: function () {
      return localStorageData();
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

    displayProducts : function (data){
      document.querySelector(DOMStrings.productContainer).innerHTML += 
      `<li class="product">
          <div class="image-container">
            <img
              class="product-image"
              src="${data.fields.image.fields.file.url}"
              alt="${data.fields.title}"
            />
            <div class="item-add">
              <button class="addTo-cart" id="${data.fields.id}">
                <i class="fas fa-cart-plus"></i>add to cart
              </button>
            </div>
          </div>
        </li>`
    
    } , 
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

  // on load 
  let updateContentfulProducts = function(){
       //1. get products from contentful 
    productJSON.getContentfulData().then((data) => {
      chosenItem = data.items;
      //2. display the products from the ui  
      chosenItem.forEach(current => display.displayProducts(current));
    });

  }

  let addItemCart = function (event) {
    let itemID , newItem , chosenItem;
    itemID = event.target.id;
    if (itemID) {
      //1.Get the chose products item from the database
      productJSON.getContentfulData().then((data) => {
        chosenItem = data.items[itemID].fields;
        //2.Save the item to our local storage
        newItem = local.saveContentfulToLocal(chosenItem.title , chosenItem.price , chosenItem.image.fields.file.url );
        //3.Display the item in the item in the cart
        updateCartProducts();
        //4.Update the total
        updateTotal();
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
      updateContentfulProducts();
    },
  };
})(productData, localStorage, displayProducts);

universalController.init();

