const BASE_URL = "https://fark618-backend.onrender.com";
const PRODUCTS_PER_PAGE = 12;

let currentPage = 1;

let allProducts = [];

let cart = [];
let html5QrCode = null;
let scanLock = false;
let selectedCustomer = null;
let isEditMode = false;

window.onload = () => {

    loadProducts();

    const barcodeInput =
        document.getElementById("barcodeInput");

    barcodeInput.addEventListener("keydown", barcodeScan);
    barcodeInput.addEventListener("input", searchProducts);

    document
        .getElementById("cameraBtn")
        .addEventListener("click", openCamera);
    document
    .getElementById("customerSearch")
    .addEventListener("input", searchCustomer);

    document
    .getElementById("custMobile")
    .addEventListener("input", validateMobile);
    
renderCart();
    loadSelectedCustomer();
};
async function loadProducts() {
    try {
        const res = await fetch(BASE_URL + "/products");
       allProducts = await res.json();

console.log(allProducts);
        renderProducts();
console.log(allProducts[0]);
console.log(allProducts[0].sizeStock);


    } catch (err) {
        console.error(err);
    }
}

function renderProducts(){

    const grid = document.getElementById("productGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;

    const end = start + PRODUCTS_PER_PAGE;

    const products = allProducts.slice(start,end);

    products.forEach(product=>{

        grid.innerHTML += `
        <div class="product-card"
             onclick="openProduct('${product._id}')">

            <img src="${product.primaryImage}" class="product-img">

            <div class="product-info">

                <h3>${product.name}</h3>

                <small>${product.category}</small>

                <p>Stock : ${product.stock}</p>

                <div class="product-price">
                    ₹${product.price}
                </div>

            </div>

        </div>
        `;

    });

}
function openProduct(id){

    const product = allProducts.find(p => p._id === id);

    document.getElementById("sizeTitle").innerHTML =
        product.styleNo + " - " + product.name;

    const box = document.getElementById("sizeList");

    box.innerHTML = "";

    product.sizeStock.forEach(size=>{

        box.innerHTML += `

        <div class="size-item"
             onclick="selectSize('${product._id}','${size.sku}')">

            <div>

                <strong>${size.size}</strong>

            </div>

            <div>

                Stock : ${size.stock}

            </div>

        </div>

        `;

    });

    document
        .getElementById("sizePopup")
        .classList.remove("hidden");

}
function barcodeScan(e){

    if(e.key !== "Enter") return;

    const barcode = String(e.target.value).trim();

    if(!barcode) return;

    // Last digit = Size
    const sizeCode = barcode.slice(-1);

    // Remaining digits = Style No
    const styleNo = barcode.slice(0, -1);

    const shirtMap = {
        "1":"S",
        "2":"M",
        "3":"L",
        "4":"XL",
        "5":"XXL"
    };

    const pantMap = {
        "1":"30",
        "2":"32",
        "3":"34",
        "4":"36",
        "5":"38",
        "6":"40"
    };

    const product = allProducts.find(p =>
        String(p.styleNo) === styleNo
    );

    if(!product){
        alert("Product Not Found");
        return;
    }

    const sizeMap =
        product.type === "pant"
            ? pantMap
            : shirtMap;

    const size = product.sizeStock.find(s =>
        s.size === sizeMap[sizeCode]
    );

    if(!size){
        alert("Size Not Found");
        return;
    }

    addToCart(product, size);

    closeSearch();

    e.target.value = "";
}
function addToCart(product,size){

    const existing = cart.find(item =>

        item.barcode === size.sku

    );

    if(existing){

        existing.qty++;

    }else{

        cart.push({

            product: product.name,

            category: product.category,

            barcode: size.sku,

            size: size.size,

            price: product.price,

            qty:1

        });

    }

    console.log(cart);
console.log(product);
console.log(size);

renderCart();

showScanToast(product,size);

updateGoCartBar();
}
function renderCart(){

    const cartBody = document.querySelector(".cart-body");
    const emptyCart = document.getElementById("emptyCart");
const cartHeader = document.getElementById("cartHeader");

    if (cart.length === 0) {

    emptyCart.classList.remove("hidden");
    cartHeader.classList.add("hidden");
document.getElementById("selectedCustomerBox")
    .classList.add("hidden");

document.querySelector(".customer-btn").style.display = "none";
    cartBody.innerHTML = "";

    document.getElementById("footerItems").innerText = 0;
document.getElementById("footerQty").innerText = 0;
document.getElementById("footerAmount").innerText = 0;

document.getElementById("subTotal").innerText = 0;
document.getElementById("grandTotal").innerText = 0;
document.getElementById("paymentGrandTotal").innerText = 0;

document.getElementById("checkoutAmount").innerText = 0;
        
   updateGoCartBar();
    return;

}
    cartBody.innerHTML = "";
    emptyCart.classList.add("hidden");
cartHeader.classList.remove("hidden");
// Cart has items

document.querySelector(".customer-btn").style.display = "";

if (selectedCustomer) {

    document.querySelector(".customer-btn").style.display = "none";

    document.getElementById("selectedCustomerBox")
        .classList.remove("hidden");

} else {

    document.getElementById("selectedCustomerBox")
        .classList.add("hidden");

}
    let grandTotal = 0;
    let totalQty = 0;

    cart.forEach((item,index)=>{

        const amount = item.qty * item.price;

        grandTotal += amount;
        totalQty += item.qty;

        cartBody.innerHTML += `

<div class="swipe-item">

   <div class="swipe-delete"
     onclick="removeItem(${index})">

    🗑 Remove

</div>

    <div class="cart-item">

        <div>${index+1}</div>

        <div>

            <strong>${item.product}</strong><br>

            <small>${item.barcode}</small>

        </div>

        <div>${item.size}</div>

        <div>

            <button onclick="changeQty(${index},-1)">−</button>

            <span style="margin:0 8px;">${item.qty}</span>

            <button onclick="changeQty(${index},1)">+</button>

        </div>

        <div>₹${item.price}</div>

        <div>₹${amount}</div>

        <div>

            <button onclick="removeItem(${index})">🗑️</button>

        </div>

    </div>

</div>

`;
    });

    document.getElementById("footerItems").innerText = cart.length;

document.getElementById("footerQty").innerText = totalQty;

document.getElementById("footerAmount").innerText = grandTotal;

document.getElementById("subTotal").innerText = grandTotal;

document.getElementById("grandTotal").innerText = grandTotal;

document.getElementById("paymentGrandTotal").innerText = grandTotal;

document.getElementById("checkoutAmount").innerText = grandTotal;
    
}
function openCustomer(){

    // Mobile
    if(window.innerWidth <= 1024){

        window.location.href = "customer.html";
        return;

    }

    // Desktop
    openAddCustomer();

}
function closeCustomerPopup(){

    document
        .getElementById("customerPopup")
        .classList.add("hidden");

}
function openSearch(list){

    document
    .getElementById("searchPopup")
    .classList.remove("hidden");

    const box =
    document.getElementById("popupResults");

    box.innerHTML="";

    list.forEach(product=>{

        box.innerHTML += `

        <div class="popup-card"
             onclick="openProduct('${product._id}')">

            <img src="${product.primaryImage}">

            <h4>${product.styleNo}</h4>

            <small>${product.category}</small>

            <p>₹${product.price}</p>

        </div>

        `;

    });

}

function closeSearch(){

    document
    .getElementById("searchPopup")
    .classList.add("hidden");

}
function searchProducts(e){

    const value = e.target.value.trim().toLowerCase();

    // Empty என்றால் popup close
    if(value === ""){

        closeSearch();
        return;

    }

    // 3 characters க்கு குறைவாக இருந்தால் popup வேண்டாம்
    if(value.length < 3){

        closeSearch();
        return;

    }

    const result = allProducts.filter(product =>

        product.styleNo.toLowerCase().includes(value) ||

        product.category.toLowerCase().includes(value) ||

        product.name.toLowerCase().includes(value)

    );

    if(result.length === 0){

        closeSearch();
        return;

    }

    openSearch(result);

}
function closeSize(){

    document
        .getElementById("sizePopup")
        .classList.add("hidden");

}

function selectSize(productId,barcode){

    const product =
        allProducts.find(p=>p._id===productId);

    const size =
        product.sizeStock.find(s=>s.sku===barcode);

    addToCart(product,size);

    closeSize();

    closeSearch();

    document
        .getElementById("barcodeInput")
        .value="";

}
function changeQty(index,value){

    cart[index].qty += value;

    if(cart[index].qty <= 0){

        cart.splice(index,1);

    }

    renderCart();
updateGoCartBar();
}

function removeItem(index){

    cart.splice(index,1);

    renderCart();
 updateGoCartBar();

}
function openCamera(){

    const popup = document.getElementById("cameraPopup");
    popup.classList.remove("hidden");

    if(html5QrCode){
        html5QrCode.stop().catch(()=>{});
    }

    html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras()

    .then(cameras=>{

        if(cameras.length===0){

            alert("Camera Not Found");

            return;

        }

        let cameraId = cameras[0].id;

        // Mobile → Back Camera
        if(cameras.length>1){
            cameraId = cameras[cameras.length-1].id;
        }

        return html5QrCode.start(

    cameraId,

    {
        fps:10
    },

    onScanSuccess,

    ()=>{}

);
    })

    .catch(err=>{

        console.error(err);

        alert(err);

    });

}
function onScanSuccess(decodedText, decodedResult){

    if(scanLock) return;

    scanLock = true;

    document.getElementById("barcodeInput").value = decodedText;

    barcodeScan({

        key:"Enter",

        target:{
            value:decodedText
        }

    });

    setTimeout(()=>{

        scanLock = false;

    },1500);

}
function closeCamera(){

    if(!html5QrCode) return;

    html5QrCode.stop()

    .then(()=>{

        html5QrCode.clear();

        html5QrCode = null;

        document
            .getElementById("cameraPopup")
            .classList.add("hidden");
        document
    .getElementById("goCartBar")
    .classList.add("hidden");

    })

    .catch(console.error);

}
function showScanToast(product, size){

    console.log("Toast Called");

    const toast = document.getElementById("scanToast");

    if(!toast){
        console.log("scanToast Not Found");
        return;
    }

    document.getElementById("toastImage").src =
        product.primaryImage || "";

    document.getElementById("toastName").textContent =
        product.name || "";

    document.getElementById("toastSize").textContent =
        "Size : " + (size.size || "");

    toast.classList.remove("hidden");

    const beep = document.getElementById("beepSound");
    if(beep) beep.play().catch(()=>{});

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(()=>{
        toast.classList.add("hidden");
    },1500);

}
function updateGoCartBar(){

    const bar = document.getElementById("goCartBar");
    const cameraPopup = document.getElementById("cameraPopup");

    // Camera close இருந்தா Go To Cart காட்டக்கூடாது
    if(cameraPopup.classList.contains("hidden")){
        bar.classList.add("hidden");
        return;
    }

    // Cart empty இருந்தாலும் hide
    if(cart.length === 0){
        bar.classList.add("hidden");
        return;
    }

    // Camera open + Cart has items
    bar.classList.remove("hidden");

    const qty = cart.reduce((t,item)=>t + item.qty,0);
    const total = cart.reduce((t,item)=>t + (item.qty * item.price),0);

    document.getElementById("goCartItems").innerText =
        cart.length + " Items";

    document.getElementById("goCartQty").innerText =
        qty + " Qty";

    document.getElementById("goCartTotal").innerText =
        total;
}
function toggleSidebar(){

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");

}
function scrollToCart(){

    // Camera open இருந்தா close பண்ணு
    closeCamera();

    // Cart Summary-க்கு scroll பண்ணு
    document.getElementById("cartFooter").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
function toggleFooterSummary(){

    const box =
        document.getElementById("footerSummary");

    const arrow =
        document.querySelector(".footer-arrow");

    box.classList.toggle("hidden");

    if(box.classList.contains("hidden")){

        arrow.innerHTML="▼";

    }else{

        arrow.innerHTML="▲";

    }

}
function enableSwipe() {

    if (window.innerWidth > 1024) return;

    document.querySelectorAll(".swipe-item").forEach(item => {

        const row = item.querySelector(".cart-item");

        let startX = 0;
        let currentX = 0;

        row.addEventListener("touchstart", e => {

            startX = e.touches[0].clientX;

        });

        row.addEventListener("touchmove", e => {

            currentX = e.touches[0].clientX;

            const diff = currentX - startX;

            if(diff < 0){

                row.style.transform =
                    `translateX(${Math.max(diff,-110)}px)`;

            }

        });

       row.addEventListener("touchend", () => {

    const moved = currentX - startX;

    if(moved < -120){

        row.style.transition = ".25s";

        row.style.transform = "translateX(-100%)";

        setTimeout(() => {

            const index = [...document.querySelectorAll(".swipe-item")]
                .indexOf(item);

            removeItem(index);

        }, 220);

    }
    else if(moved < -70){

        row.style.transition = ".25s";

        row.style.transform = "translateX(-110px)";

    }
    else{

        row.style.transition = ".25s";

        row.style.transform = "translateX(0px)";

    }

});
    });

}
async function searchCustomer(){

    const input = document.getElementById("customerSearch");
    const dropdown = document.getElementById("customerDropdown");
    const results = document.getElementById("customerResults");
    const createBox = document.getElementById("customerCreate");

    const value = input.value.trim();
if(isEditMode){

    return;

}
    // Empty
  if(value === ""){

    resetCustomerUI();

    return;

}
    const res = await fetch(
        BASE_URL +
        "/pos/customers/search?q=" +
        encodeURIComponent(value)
    );

    const data = await res.json();

    results.innerHTML = "";

    if(data.customers.length === 0){

        createBox.classList.remove("hidden");

        document
            .getElementById("customerForm")
            .classList.add("hidden");

        document.getElementById("custMobile").value = value;
       
        isEditMode = false;

document.getElementById("saveCustomerBtn").textContent =
    "Save Customer";

document.getElementById("custName").value = "";
document.getElementById("custEmail").value = "";
document.getElementById("custGST").value = "";
document.getElementById("custAddress").value = "";

    }else{

        createBox.classList.add("hidden");

        data.customers.forEach(customer=>{

            results.innerHTML += `
                <div class="customer-item"
                     onclick='selectCustomer(${JSON.stringify(customer)})'>

                    <strong>${customer.name}</strong><br>

                    <small>${customer.mobile}</small>

                </div>
            `;

        });

    }

    dropdown.classList.remove("hidden");

}
function selectCustomer(customer){

    selectedCustomer = customer;

    document.getElementById("customerSearch").value =
        `${customer.name} (${customer.mobile})`;

    document
        .getElementById("customerActions")
        .classList.remove("hidden");

    document
        .getElementById("customerDropdown")
        .classList.add("hidden");

}
function openCheckout(){

    alert("Checkout Screen Coming Next 🚀");

}
function toggleCustomerForm(){
document.getElementById("noCustomerMsg").style.display = "none";

document.getElementById("createCustomerBtn").style.display = "none";
    document
        .getElementById("customerForm")
        .classList.remove("hidden");

}
function closeCustomerForm(){

    isEditMode = false;

    document.getElementById("saveCustomerBtn").textContent =
        "Save Customer";

    document.getElementById("customerForm")
        .classList.add("hidden");

    document.getElementById("customerCreate")
        .classList.add("hidden");

    document.getElementById("noCustomerMsg").style.display = "";

    document.getElementById("createCustomerBtn").style.display = "";

}

function validateMobile(){

    const mobile =
        document.getElementById("custMobile");

    const status =
        document.getElementById("mobileStatus");

    const value = mobile.value.trim();

    // Digits only
    mobile.value = value.replace(/\D/g,"");

    if(mobile.value.length === 0){

        mobile.classList.remove("mobile-valid");
        mobile.classList.remove("mobile-invalid");

        status.textContent = "";

        return;

    }

    if(/^\d{10}$/.test(mobile.value)){

        mobile.classList.add("mobile-valid");
        mobile.classList.remove("mobile-invalid");

        status.textContent = "✓";

        status.className = "mobile-status valid";

    }else{

        mobile.classList.add("mobile-invalid");
        mobile.classList.remove("mobile-valid");

        status.textContent = "✕";

        status.className = "mobile-status invalid";

    }

}
async function saveCustomer(){

    const name = document.getElementById("custName").value.trim();
    const mobile = document.getElementById("custMobile").value.trim();
    const email = document.getElementById("custEmail").value.trim();
    const gst = document.getElementById("custGST").value.trim();
    const address = document.getElementById("custAddress").value.trim();

    if(name === ""){

        alert("Enter Customer Name");
        return;

    }

    if (name === "") {
    alert("Enter Customer Name");
    return;
}

if (!/^\d{10}$/.test(mobile)) {
    alert("Please enter a valid 10-digit Mobile Number");
    return;
}

if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Please enter a valid Email");
    return;
}
    // GST Optional
if (gst !== "" && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase())) {

    alert("Enter a valid GST Number");

    return;

}
    try{

      let url = BASE_URL + "/pos/customers";
let method = "POST";

if (isEditMode) {
    url = BASE_URL + "/pos/customers/" + selectedCustomer._id;
    method = "PUT";
}

const res = await fetch(url, {
    method: method,
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        name,
        mobile,
        email,
        gstNo: gst,
        address
    })
});
        const data = await res.json();

        if(!res.ok){

            alert(data.message || "Unable to save customer");
            return;

        }

        // Auto Select Customer
        selectedCustomer = data.customer;
alert(
    isEditMode
        ? "Customer Updated Successfully"
        : "Customer Saved Successfully"
);
        document.getElementById("customerSearch").value =
            `${data.customer.name} (${data.customer.mobile})`;

        // Close Dropdown
        document.getElementById("customerDropdown")
            .classList.add("hidden");
        document
    .getElementById("customerActions")
    .classList.remove("hidden");

        // Clear Form
        document.getElementById("custName").value = "";
        document.getElementById("custMobile").value = "";
        document.getElementById("custEmail").value = "";
        document.getElementById("custGST").value = "";
        document.getElementById("custAddress").value = "";

    }catch(err){

        console.error(err);
        alert("Server Error");

    }

}
function resetCustomerUI(){

    const dropdown = document.getElementById("customerDropdown");

    dropdown.classList.add("hidden");
    dropdown.classList.remove("show-form");

    document.getElementById("customerResults").innerHTML = "";

    document.getElementById("customerCreate")
        .classList.add("hidden");

    document.getElementById("customerForm")
        .classList.add("hidden");

    document.getElementById("noCustomerMsg").style.display = "";

    document.getElementById("createCustomerBtn").style.display = "";

    document.getElementById("saveCustomerBtn").textContent =
        "Save Customer";

    isEditMode = false;
}

function clearCustomer(){

    selectedCustomer = null;

    document.getElementById("customerSearch").value = "";

    resetCustomerUI();

    document
        .getElementById("customerActions")
        .classList.add("hidden");

}
function editCustomer(){

    if(!selectedCustomer) return;

    isEditMode = true;

    const dropdown = document.getElementById("customerDropdown");

    dropdown.classList.remove("hidden");
    dropdown.classList.add("show-form");
document.getElementById("customerCreate").classList.remove("hidden");
document.getElementById("customerResults").innerHTML = "";
document.getElementById("noCustomerMsg").style.display = "none";

document.getElementById("createCustomerBtn").style.display = "none";
    document.getElementById("customerForm").classList.remove("hidden");

    document.getElementById("custName").value =
        selectedCustomer.name || "";

    document.getElementById("custMobile").value =
        selectedCustomer.mobile || "";

    document.getElementById("custEmail").value =
        selectedCustomer.email || "";

    document.getElementById("custGST").value =
        selectedCustomer.gstNo || "";

    document.getElementById("custAddress").value =
        selectedCustomer.address || "";

    document.getElementById("saveCustomerBtn").textContent =
        "Update Customer";

}
function loadSelectedCustomer(){

    const customer = JSON.parse(
        localStorage.getItem("selectedCustomer")
    );

    if(!customer) return;

    selectedCustomer = customer;

    // Desktop
    document.getElementById("customerSearch").value =
        `${customer.name} (${customer.mobile})`;

    document
        .getElementById("customerActions")
        .classList.remove("hidden");

    // Mobile Customer Card
    document.getElementById("selectedCustomerName").innerText =
        customer.name;

    document.getElementById("selectedCustomerMobile").innerText =
        customer.mobile;

   const box = document.getElementById("selectedCustomerBox");

if (window.innerWidth <= 768) {

    box.classList.remove("hidden");
    box.classList.add("show");
if (window.innerWidth <= 768) {
    document.querySelector(".customer-btn").style.display = "none";
}
} else {

    box.classList.add("hidden");
}
}
function editSelectedCustomer(){

    window.location.href = "customer.html";

}

function clearSelectedCustomer(){

    localStorage.removeItem("selectedCustomer");

    selectedCustomer = null;

    const box = document.getElementById("selectedCustomerBox");

box.classList.remove("show");
box.classList.add("hidden");

    document.getElementById("customerSearch").value = "";

    document
        .getElementById("customerActions")
        .classList.add("hidden");
document.querySelector(".customer-btn").style.display = "";
}
