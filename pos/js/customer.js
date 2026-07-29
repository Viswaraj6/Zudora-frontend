const BASE_URL = "https://fark618-backend.onrender.com";

let customers = [];
const customerList = document.getElementById("customerList");
const searchInput = document.getElementById("customerSearch");

loadCustomers();
async function loadCustomers(){

    try{

        const res = await fetch(BASE_URL + "/pos/customers");

        const data = await res.json();

        customers = data.customers || [];
renderCustomers(customers);
        
    }catch(err){

        console.error(err);

        alert("Unable to load customers");

    }

}
function renderCustomers(data){

    customerList.innerHTML = "";

    data.forEach(customer=>{

        customerList.innerHTML += `

        <div class="customer-card"
            onclick="selectCustomer('${customer._id}')"

            <div class="customer-name">
                ${customer.name}
            </div>

            <div class="customer-mobile">
                ${customer.mobile}
            </div>

        </div>

        `;

    });

}

searchInput.addEventListener("input", () => {

    const value = searchInput.value.trim().toLowerCase();

    // Search empty
    if (value === "") {

        renderCustomers(customers);

        document.getElementById("customerCreate")
            .classList.add("hidden");

        return;
    }

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(value) ||
        c.mobile.includes(value)
    );

    renderCustomers(filtered);

    if (filtered.length === 0) {

        document.getElementById("customerCreate")
            .classList.remove("hidden");

        document.getElementById("custMobile").value = value;

    } else {

        document.getElementById("customerCreate")
            .classList.add("hidden");

    }

});
function selectCustomer(id){

    const customer =
        customers.find(c=>c._id===id);

    localStorage.setItem(
        "selectedCustomer",
        JSON.stringify(customer)
    );

    window.location.href = "billing.html";

}
async function saveCustomer(){

    const customer = {

        name: document.getElementById("custName").value.trim(),

        mobile: document.getElementById("custMobile").value.trim(),

        email: document.getElementById("custEmail").value.trim(),

        address: document.getElementById("custAddress").value.trim()

    };

    if(!customer.name || !customer.mobile){

        alert("Name and Mobile Required");

        return;

    }

    const res = await fetch(BASE_URL + "/pos/customers",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(customer)

    });

    const data = await res.json();

    if(data.success){

        alert("Customer Added Successfully");

        closeCustomerPopup();

        loadCustomers();

    }else{

        alert(data.message || "Failed");

    }

}
